import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildUserPrompt, formatContext, formatSources, REFUSAL } from "../context.ts";
import { docIdOf, type Chunk, type KnowledgeBase } from "../knowledge-base.ts";
import { toParquet } from "../parquet.ts";
import type { Retriever } from "../retrieval.ts";
import { QA_ITEMS, type Category, type QaItem, type Split } from "./qa.ts";

/** Trechos por exemplo: o trecho certo + distratores reais vindos da busca. */
export const DATASET_TOP_K = 3;

/** Uma linha do dataset (todas as colunas são texto; listas vão serializadas em JSON). */
export interface DatasetRecord {
  id: string;
  split: Split;
  category: Category;
  question: string;
  /** Trechos recuperados, já formatados como aparecem no prompt. */
  context: string;
  /** Mensagem `user` completa (documentos + pergunta) — o que o modelo vê no modo com grounding. */
  prompt: string;
  /** Resposta-alvo (com a linha "Fonte:") ou a recusa padrão. */
  answer: string;
  /** JSON: IDs dos documentos que fundamentam a resposta. */
  sources: string;
  /** JSON: fatos que a resposta precisa conter (forma canônica, alternativas com "|"). */
  must_include: string;
  /** JSON: IDs das seções colocadas no contexto, na ordem da busca. */
  context_ids: string;
  [key: string]: string;
}

export const COLUMNS = ["id", "split", "category", "question", "context", "prompt", "answer", "sources", "must_include", "context_ids"];

export interface BuildStats {
  total: number;
  bySplit: Record<Split, number>;
  byCategory: Record<Split, Record<Category, number>>;
  /** Exemplos em que a busca NÃO trouxe a seção certa e ela teve de ser incluída à força. */
  goldInjected: string[];
}

function contextFor(item: QaItem, kb: KnowledgeBase, retriever: Retriever, stats: BuildStats): Chunk[] {
  const retrieved = retriever.search(item.question, DATASET_TOP_K).map((r) => r.chunk);
  const missing = item.sections.filter((id) => !retrieved.some((c) => c.id === id));
  if (!missing.length) return retrieved;

  stats.goldInjected.push(item.id);
  const gold = missing.map((id) => {
    const chunk = kb.chunks.find((c) => c.id === id);
    if (!chunk) throw new Error(`${item.id}: seção inexistente "${id}".`);
    return chunk;
  });
  const others = retrieved.filter((c) => !item.sections.includes(c.id));
  return [...retrieved.filter((c) => item.sections.includes(c.id)), ...gold, ...others].slice(0, Math.max(DATASET_TOP_K, item.sections.length));
}

export function buildRecords(kb: KnowledgeBase, retriever: Retriever, items: QaItem[] = QA_ITEMS): { records: DatasetRecord[]; stats: BuildStats } {
  const stats: BuildStats = {
    total: items.length,
    bySplit: { train: 0, test: 0 },
    byCategory: {
      train: { answerable: 0, multi_doc: 0, out_of_base: 0 },
      test: { answerable: 0, multi_doc: 0, out_of_base: 0 }
    },
    goldInjected: []
  };
  const seen = new Set<string>();
  const records = items.map((item) => {
    if (seen.has(item.id)) throw new Error(`ID duplicado no dataset: ${item.id}`);
    seen.add(item.id);
    stats.bySplit[item.split]++;
    stats.byCategory[item.split][item.category]++;

    const chunks = contextFor(item, kb, retriever, stats);
    const docIds = [...new Set(item.sections.map(docIdOf))];
    const answer = item.category === "out_of_base" ? REFUSAL : `${item.answer}\n${formatSources(docIds)}`;
    return {
      id: item.id,
      split: item.split,
      category: item.category,
      question: item.question,
      context: formatContext(chunks),
      prompt: buildUserPrompt(item.question, chunks),
      answer,
      sources: JSON.stringify(docIds),
      must_include: JSON.stringify(item.mustInclude),
      context_ids: JSON.stringify(chunks.map((c) => c.id))
    } satisfies DatasetRecord;
  });
  return { records, stats };
}

export function writeDataset(outDir: string, records: DatasetRecord[]): string[] {
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const split of ["train", "test"] as const) {
    const rows = records.filter((r) => r.split === split);
    const jsonl = join(outDir, `${split}.jsonl`);
    const parquet = join(outDir, `${split}.parquet`);
    writeFileSync(jsonl, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
    writeFileSync(parquet, toParquet(rows, COLUMNS));
    written.push(jsonl, parquet);
  }
  return written;
}

/** docs/exemplos.md: perguntas, contexto recuperado e resposta-alvo, para leitura humana. */
export function renderExamples(records: DatasetRecord[], stats: BuildStats): string {
  const label: Record<Category, string> = { answerable: "na base", multi_doc: "multi-documento", out_of_base: "fora da base" };
  const lines = [
    "# Exemplos de perguntas e respostas",
    "",
    "> Gerado por `npm run build-dataset`. Não edite à mão: a fonte é [src/dataset/qa.ts](../src/dataset/qa.ts).",
    "",
    "| Split | Na base | Multi-documento | Fora da base | Total |",
    "|---|---|---|---|---|",
    ...(["train", "test"] as const).map((s) => {
      const c = stats.byCategory[s];
      return `| ${s} | ${c.answerable} | ${c.multi_doc} | ${c.out_of_base} | ${stats.bySplit[s]} |`;
    }),
    "",
    `Cada exemplo leva os ${DATASET_TOP_K} trechos mais bem ranqueados pela busca BM25 — inclusive nas perguntas fora da base,`,
    "em que os trechos são parecidos mas não respondem (distratores). O modelo aprende a responder a partir deles ou recusar.",
    ""
  ];
  for (const split of ["train", "test"] as const) {
    lines.push(`## ${split === "train" ? "Treino" : "Teste"}`, "");
    for (const r of records.filter((x) => x.split === split)) {
      const ctx = (JSON.parse(r.context_ids) as string[]).join(", ");
      lines.push(
        `### ${r.id} · ${label[r.category]}`,
        "",
        `**Pergunta:** ${r.question}`,
        "",
        `**Contexto recuperado:** ${ctx}`,
        "",
        `**Resposta-alvo:**`,
        "",
        ...r.answer.split("\n").map((l) => `> ${l}`),
        ""
      );
    }
  }
  return lines.join("\n");
}
