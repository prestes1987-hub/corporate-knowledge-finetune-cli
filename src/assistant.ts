import { groundedMessages, REFUSAL, ungroundedMessages, type ChatMessage } from "./context.ts";
import type { LlmProvider } from "./llm.ts";
import type { RetrievedChunk, Retriever } from "./retrieval.ts";

export interface Engine {
  retriever: Retriever;
  llm: LlmProvider;
  threshold: number;
  topK: number;
}

export interface AssistantAnswer {
  text: string;
  grounding: boolean;
  /** Tudo o que a busca trouxe (top-k), com scores — para o --debug. */
  retrieved: RetrievedChunk[];
  /** Trechos que passaram no threshold e foram para o contexto. */
  used: RetrievedChunk[];
  /** true quando nenhum trecho passou no threshold e o LLM nem foi chamado. */
  blockedByThreshold: boolean;
  messages: ChatMessage[];
  /** IDs citados em "Fonte:" que NÃO estavam no contexto (citação inventada). */
  invalidCitations: string[];
}

export function citedIds(text: string): string[] {
  const line = text.split("\n").reverse().find((l) => /^\s*fonte/i.test(l)) ?? "";
  return [...line.matchAll(/\[([A-Z]+-[A-Z]+)\]/g)].map((m) => m[1]!);
}

/**
 * Pipeline com grounding: busca → threshold → contexto estruturado → LLM → checagem de citação.
 * Sem grounding: a pergunta vai direto ao LLM (baseline para comparação).
 */
export async function answer(engine: Engine, question: string, options: { grounding: boolean }): Promise<AssistantAnswer> {
  if (!options.grounding) {
    if (!engine.llm.canAnswerWithoutContext) {
      throw new Error(`O modo sem grounding precisa de um LLM real (configure LLM_BASE_URL/OPENAI_API_KEY); "${engine.llm.name}" só responde a partir de documentos.`);
    }
    const messages = ungroundedMessages(question);
    const text = await engine.llm.complete({ messages, question, chunks: [] });
    return { text, grounding: false, retrieved: [], used: [], blockedByThreshold: false, messages, invalidCitations: [] };
  }

  const retrieved = engine.retriever.search(question, engine.topK);
  const used = retrieved.filter((r) => r.coverage >= engine.threshold);
  if (!used.length) {
    return { text: REFUSAL, grounding: true, retrieved, used, blockedByThreshold: true, messages: [], invalidCitations: [] };
  }
  const chunks = used.map((r) => r.chunk);
  const messages = groundedMessages(question, chunks);
  const text = await engine.llm.complete({ messages, question, chunks });
  const allowed = new Set(chunks.map((c) => c.docId));
  const invalidCitations = citedIds(text).filter((id) => !allowed.has(id));
  return { text, grounding: true, retrieved, used, blockedByThreshold: false, messages, invalidCitations };
}
