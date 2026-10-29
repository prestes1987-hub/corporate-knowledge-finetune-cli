import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { answer, type AssistantAnswer, type Engine } from "./assistant.ts";
import { loadConfig, type Config } from "./config.ts";
import { buildRecords, renderExamples, writeDataset } from "./dataset/build.ts";
import { QA_ITEMS } from "./dataset/qa.ts";
import { evaluateRetrieval, renderRetrievalReport } from "./eval/retrieval-eval.ts";
import { loadKnowledgeBase } from "./knowledge-base.ts";
import { ExtractiveProvider, OpenAICompatibleProvider, type LlmProvider } from "./llm.ts";
import { buildNotebook } from "./notebook/build-notebook.ts";
import { Retriever } from "./retrieval.ts";

const HELP = `Uso:
  npm run kb                                 lista a base de conhecimento (documentos e seções)
  npm run build-dataset                      gera dataset/{train,test}.{jsonl,parquet} e docs/exemplos.md
  npm run notebook                           gera colab/finetune_qlora_limpo.ipynb (versão sem saídas)
  npm run ask -- "pergunta" [opções]         responde com grounding na base
  npm run ask -- [opções]                    modo interativo
  npm run eval                               avalia a recuperação e gera docs/retrieval-report.md

Opções do ask:
  --no-grounding      envia só a pergunta ao LLM (baseline; exige LLM real)
  --compare           mostra a resposta com e sem grounding lado a lado (exige LLM real)
  --debug             mostra trechos recuperados, cobertura, threshold e o contexto enviado
  --threshold <0..1>  cobertura mínima para um trecho entrar no contexto (padrão 0.10)
  --top-k <n>         máximo de trechos no contexto (padrão 3)
  --offline           força o LLM extrativo local`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "no-grounding": { type: "boolean" },
      compare: { type: "boolean" },
      debug: { type: "boolean" },
      threshold: { type: "string" },
      "top-k": { type: "string" },
      offline: { type: "boolean" },
      help: { type: "boolean", short: "h" }
    }
  });
  if (values.help) return console.log(HELP);

  const config = loadConfig({
    debug: values.debug,
    offline: values.offline,
    threshold: values.threshold === undefined ? undefined : Number(values.threshold),
    topK: values["top-k"] === undefined ? undefined : Number(values["top-k"])
  });

  const [command = "ask", ...args] = positionals;
  switch (command) {
    case "kb": return listKnowledgeBase(config);
    case "build-dataset": return buildDataset(config);
    case "notebook": return writeOutput("colab/finetune_qlora_limpo.ipynb", buildNotebook());
    case "ask": return ask(config, args.join(" ").trim(), { grounding: !values["no-grounding"], compare: values.compare ?? false });
    case "eval": return evalRetrieval(config);
    default: throw new Error(`Comando desconhecido: "${command}".\n\n${HELP}`);
  }
}

function writeOutput(path: string, content: string): void {
  const full = resolve(path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  console.log(`✔ ${relative(process.cwd(), full)}`);
}

function listKnowledgeBase(config: Config): void {
  const kb = loadKnowledgeBase(config.kbDir);
  for (const doc of kb.documents) {
    console.log(`\n${doc.id} — ${doc.title} (v${doc.version}, vigência ${doc.effectiveDate}, ${doc.area})`);
    for (const chunk of kb.chunks.filter((c) => c.docId === doc.id)) console.log(`  ${chunk.id}  ${chunk.heading}`);
  }
  console.log(`\n${kb.documents.length} documentos, ${kb.chunks.length} seções.`);
}

function buildDataset(config: Config): void {
  const kb = loadKnowledgeBase(config.kbDir);
  const { records, stats } = buildRecords(kb, new Retriever(kb.chunks));
  for (const file of writeDataset(resolve("dataset"), records)) console.log(`✔ ${relative(process.cwd(), file)}`);
  writeOutput("docs/exemplos.md", renderExamples(records, stats));
  for (const split of ["train", "test"] as const) {
    const c = stats.byCategory[split];
    console.log(`  ${split}: ${stats.bySplit[split]} exemplos (na base ${c.answerable}, multi-documento ${c.multi_doc}, fora da base ${c.out_of_base})`);
  }
  if (stats.goldInjected.length) {
    console.log(`  ⚠ a busca não trouxe a seção-fonte em ${stats.goldInjected.join(", ")}; ela foi incluída no contexto à força.`);
  }
}

function evalRetrieval(config: Config): void {
  const kb = loadKnowledgeBase(config.kbDir);
  const metrics = evaluateRetrieval(new Retriever(kb.chunks), QA_ITEMS, config.topK);
  writeOutput("docs/retrieval-report.md", renderRetrievalReport(metrics, config.threshold, `${kb.documents.length} documentos, ${kb.chunks.length} seções`));
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  console.log(`  Recall@1 ${pct(metrics.recallAt1)} | Recall@${metrics.topK} ${pct(metrics.recallAtK)} | MRR ${metrics.mrr.toFixed(3)}`);
  for (const s of metrics.sweep) {
    console.log(`  threshold ${s.threshold.toFixed(2)}: fonte mantida ${pct(s.answerableKept)} | fora da base barradas ${pct(s.outOfBaseBlocked)}${s.threshold === config.threshold ? "  ← padrão" : ""}`);
  }
}

function createLlm(config: Config): LlmProvider {
  if (config.offline || !config.llmBaseUrl) return new ExtractiveProvider();
  return new OpenAICompatibleProvider({ baseUrl: config.llmBaseUrl, apiKey: config.llmApiKey, model: config.llmModel });
}

function printDebug(result: AssistantAnswer, engine: Engine): void {
  const c = (s: string) => `\x1b[36m${s}\x1b[0m`;
  if (!result.grounding) return console.error(c("[debug] sem grounding: a pergunta foi enviada sozinha ao LLM."));
  console.error(c(`[debug] busca BM25 top-${engine.topK} | threshold de cobertura ${engine.threshold}`));
  for (const r of result.retrieved) {
    const mark = r.coverage >= engine.threshold ? "✔ contexto" : "✘ abaixo do threshold";
    console.error(c(`  ${r.chunk.id.padEnd(20)} cobertura ${r.coverage.toFixed(2)}  bm25 ${r.bm25.toFixed(2)}  ${mark}`));
  }
  if (result.blockedByThreshold) console.error(c("[debug] nenhum trecho passou no threshold → recusa padrão, LLM não chamado."));
  const user = result.messages.find((m) => m.role === "user");
  if (user) console.error(c(`[debug] mensagem enviada ao LLM:\n${user.content}`));
  if (result.invalidCitations.length) console.error(c(`[debug] ⚠ citação de documento fora do contexto: ${result.invalidCitations.join(", ")}`));
}

async function ask(config: Config, question: string, options: { grounding: boolean; compare: boolean }): Promise<void> {
  const kb = loadKnowledgeBase(config.kbDir);
  const engine: Engine = { retriever: new Retriever(kb.chunks), llm: createLlm(config), threshold: config.threshold, topK: config.topK };
  if (config.debug) console.error(`\x1b[36m[debug] llm=${engine.llm.name} | base=${kb.documents.length} documentos/${kb.chunks.length} seções\x1b[0m`);

  const run = async (q: string) => {
    if (options.compare) {
      const without = await answer(engine, q, { grounding: false });
      const withCtx = await answer(engine, q, { grounding: true });
      if (config.debug) printDebug(withCtx, engine);
      console.log(`\n── SEM grounding ──\n${without.text}\n\n── COM grounding ──\n${withCtx.text}\n`);
      return;
    }
    const result = await answer(engine, q, { grounding: options.grounding });
    if (config.debug) printDebug(result, engine);
    console.log(`\n${result.text}\n`);
  };

  if (question) return run(question);

  console.log(`Assistente de Conhecimento Interno — Lumora (${engine.llm.name}${options.grounding ? "" : ", SEM grounding"}). Linha vazia para sair.`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () => new Promise<string>((res) => rl.question("> ", res));
  for (let line = await prompt(); line.trim(); line = await prompt()) {
    try {
      await run(line.trim());
    } catch (error) {
      console.error((error as Error).message);
    }
  }
  rl.close();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
