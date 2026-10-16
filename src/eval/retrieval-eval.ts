import type { QaItem } from "../dataset/qa.ts";
import type { Retriever } from "../retrieval.ts";

export const SWEEP = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];

export interface RetrievalMetrics {
  answerable: number;
  outOfBase: number;
  topK: number;
  /** Fração das perguntas respondíveis com TODAS as seções-fonte no top-1 / top-k. */
  recallAt1: number;
  recallAtK: number;
  /** Mean Reciprocal Rank da primeira seção-fonte. */
  mrr: number;
  sweep: Array<{ threshold: number; answerableKept: number; outOfBaseBlocked: number }>;
  misses: Array<{ id: string; question: string; expected: string[]; got: string[] }>;
}

export function evaluateRetrieval(retriever: Retriever, items: QaItem[], topK: number): RetrievalMetrics {
  const answerable = items.filter((i) => i.category !== "out_of_base");
  const outOfBase = items.filter((i) => i.category === "out_of_base");
  let hit1 = 0;
  let hitK = 0;
  let rr = 0;
  const misses: RetrievalMetrics["misses"] = [];
  const sweepKept = SWEEP.map(() => 0);
  const sweepBlocked = SWEEP.map(() => 0);

  for (const item of answerable) {
    const results = retriever.search(item.question, topK);
    const ids = results.map((r) => r.chunk.id);
    if (item.sections.length === 1 && ids[0] === item.sections[0]) hit1++;
    if (item.sections.every((s) => ids.includes(s))) hitK++;
    else misses.push({ id: item.id, question: item.question, expected: item.sections, got: ids });
    const rank = ids.findIndex((id) => item.sections.includes(id));
    if (rank >= 0) rr += 1 / (rank + 1);
    SWEEP.forEach((t, i) => {
      const kept = results.filter((r) => r.coverage >= t).map((r) => r.chunk.id);
      if (item.sections.every((s) => kept.includes(s))) sweepKept[i]!++;
    });
  }
  for (const item of outOfBase) {
    const results = retriever.search(item.question, topK);
    SWEEP.forEach((t, i) => {
      if (!results.some((r) => r.coverage >= t)) sweepBlocked[i]!++;
    });
  }

  return {
    answerable: answerable.length,
    outOfBase: outOfBase.length,
    topK,
    recallAt1: hit1 / answerable.length,
    recallAtK: hitK / answerable.length,
    mrr: rr / answerable.length,
    sweep: SWEEP.map((threshold, i) => ({
      threshold,
      answerableKept: sweepKept[i]! / answerable.length,
      outOfBaseBlocked: sweepBlocked[i]! / Math.max(1, outOfBase.length)
    })),
    misses
  };
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function renderRetrievalReport(m: RetrievalMetrics, threshold: number, kbSummary: string): string {
  const chosen = m.sweep.find((s) => s.threshold === threshold);
  return [
    "# Relatório de recuperação (grounding)",
    "",
    "> Gerado por `npm run eval`. Avalia a etapa que conecta a IA aos documentos: a busca encontra o trecho certo?",
    "> O threshold de cobertura separa perguntas da base das de fora da base?",
    "",
    `Base: ${kbSummary}. Perguntas: ${m.answerable} respondíveis e ${m.outOfBase} fora da base (treino + teste).`,
    "",
    "## Busca",
    "",
    "| Métrica | Valor |",
    "|---|---|",
    `| Recall@1 (seção certa em 1º lugar, perguntas de 1 seção) | ${pct(m.recallAt1)} |`,
    `| Recall@${m.topK} (todas as seções certas no top-${m.topK}) | ${pct(m.recallAtK)} |`,
    `| MRR | ${m.mrr.toFixed(3)} |`,
    "",
    "## Threshold de cobertura",
    "",
    "Cobertura = fração, ponderada por IDF, dos termos da pergunta presentes no trecho. Abaixo do threshold o trecho",
    "não entra no contexto; se nenhum entrar, o LLM nem é chamado e a resposta é a recusa padrão.",
    "",
    "| Threshold | Respondíveis com a fonte mantida | Fora da base barradas antes do LLM |",
    "|---|---|---|",
    ...m.sweep.map((s) => `| ${s.threshold.toFixed(2)}${s.threshold === threshold ? " **(padrão)**" : ""} | ${pct(s.answerableKept)} | ${pct(s.outOfBaseBlocked)} |`),
    "",
    "### Leitura",
    "",
    chosen
      ? `Com o threshold padrão (${threshold}), ${pct(chosen.answerableKept)} das perguntas respondíveis mantêm a fonte no contexto `
        + `e ${pct(chosen.outOfBaseBlocked)} das perguntas fora da base são barradas antes do LLM.`
      : `Threshold atual: ${threshold}.`,
    "Subir o threshold barra mais perguntas fora da base, mas começa a cortar a fonte de perguntas legítimas — e uma",
    "resposta certa perdida é pior que uma recusa que o modelo pode dar sozinho. Por isso o threshold fica baixo (filtro",
    "grosso) e **a decisão fina \"isto responde ou não?\" fica com o modelo**: perguntas fora da base costumam trazer",
    "trechos parecidos (ex.: \"auxílio-funeral\" recupera \"licença nojo\"). Ensinar o modelo a ler o contexto e recusar",
    "quando ele não responde é justamente o objetivo do fine-tuning — ver [justificativa.md](justificativa.md).",
    "",
    "## Perguntas em que a busca não trouxe todas as fontes",
    "",
    m.misses.length
      ? ["| ID | Pergunta | Esperado | Top-k |", "|---|---|---|---|",
        ...m.misses.map((x) => `| ${x.id} | ${x.question} | ${x.expected.join(", ")} | ${x.got.join(", ")} |`)].join("\n")
      : "Nenhuma: todas as perguntas respondíveis tiveram as seções-fonte recuperadas no top-k.",
    ""
  ].join("\n");
}
