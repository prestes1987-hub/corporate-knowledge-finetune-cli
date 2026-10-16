import type { Chunk } from "./knowledge-base.ts";
import { tokenize } from "./text.ts";

export interface RetrievedChunk {
  chunk: Chunk;
  /** Score BM25 bruto (usado só para ordenar). */
  bm25: number;
  /**
   * Cobertura (0..1): fração, ponderada por IDF, dos termos da pergunta que aparecem no trecho.
   * Termos que não existem em nenhum documento ("PLR", "pet") pesam muito e derrubam a
   * cobertura — é isso que torna o threshold um bom detector de pergunta fora da base.
   */
  coverage: number;
}

const K1 = 1.2;
const B = 0.75;

/** Busca lexical BM25 sobre as seções da base (título do documento + título da seção + texto). */
export class Retriever {
  private readonly docs: Array<{ chunk: Chunk; tf: Map<string, number>; length: number }>;
  private readonly df = new Map<string, number>();
  private readonly avgLength: number;

  constructor(chunks: Chunk[]) {
    this.docs = chunks.map((chunk) => {
      const tokens = tokenize(`${chunk.docTitle} ${chunk.heading} ${chunk.text}`);
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      return { chunk, tf, length: tokens.length };
    });
    this.avgLength = this.docs.reduce((sum, d) => sum + d.length, 0) / Math.max(1, this.docs.length);
  }

  private idf(term: string): number {
    const n = this.docs.length;
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  search(question: string, topK: number): RetrievedChunk[] {
    const terms = [...new Set(tokenize(question))];
    const totalIdf = terms.reduce((sum, t) => sum + this.idf(t), 0);
    if (!terms.length || totalIdf === 0) return [];

    const results: RetrievedChunk[] = [];
    for (const doc of this.docs) {
      let bm25 = 0;
      let covered = 0;
      for (const term of terms) {
        const tf = doc.tf.get(term);
        if (!tf) continue;
        const idf = this.idf(term);
        covered += idf;
        bm25 += idf * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * doc.length / this.avgLength));
      }
      if (bm25 > 0) results.push({ chunk: doc.chunk, bm25, coverage: covered / totalIdf });
    }
    return results.sort((a, b) => b.bm25 - a.bm25).slice(0, topK);
  }
}
