import { formatSources, REFUSAL, type ChatMessage } from "./context.ts";
import type { Chunk } from "./knowledge-base.ts";
import { splitSentences, tokenize } from "./text.ts";

export interface LlmRequest {
  messages: ChatMessage[];
  question: string;
  /** Trechos no contexto (vazio no modo sem grounding). */
  chunks: Chunk[];
}

export interface LlmProvider {
  readonly name: string;
  /** Provedores que não geram texto livre não servem para o modo sem grounding. */
  readonly canAnswerWithoutContext: boolean;
  complete(request: LlmRequest): Promise<string>;
}

/** Qualquer endpoint `/chat/completions`: OpenAI, Ollama, vLLM (ex.: o modelo fine-tunado servido localmente). */
export class OpenAICompatibleProvider implements LlmProvider {
  readonly name: string;
  readonly canAnswerWithoutContext = true;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(options: { baseUrl: string; apiKey?: string; model: string }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.name = `${new URL(this.baseUrl).host}:${options.model}`;
  }

  async complete(request: LlmRequest): Promise<string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: this.model, messages: request.messages }),
      signal: AbortSignal.timeout(120_000)
    });
    if (!response.ok) throw new Error(`LLM: HTTP ${response.status} ${await response.text()}`);
    const data = await response.json() as { choices: Array<{ message: { content: string | null } }> };
    const text = data.choices[0]?.message.content?.trim();
    if (!text) throw new Error("O LLM não retornou texto.");
    return text;
  }
}

/**
 * "LLM" offline e determinístico: devolve as frases dos trechos que mais se parecem com a pergunta,
 * no formato que o modelo fine-tunado aprende (até 3 frases + "Fonte: [ID]").
 * Serve para rodar a CLI sem GPU nem chave — não é o modelo avaliado no Colab.
 */
export class ExtractiveProvider implements LlmProvider {
  readonly name = "extrativo-local";
  readonly canAnswerWithoutContext = false;

  async complete(request: LlmRequest): Promise<string> {
    const query = new Set(tokenize(request.question));
    const scored: Array<{ sentence: string; docId: string; overlap: number; order: number }> = [];
    let order = 0;
    for (const chunk of request.chunks) {
      for (const sentence of splitSentences(chunk.text)) {
        const overlap = new Set(tokenize(sentence).filter((t) => query.has(t))).size;
        if (overlap) scored.push({ sentence, docId: chunk.docId, overlap, order: order++ });
      }
    }
    if (!scored.length) return REFUSAL;
    const best = scored.sort((a, b) => b.overlap - a.overlap || a.order - b.order)[0]!.overlap;
    const picked = scored.filter((s) => s.overlap >= Math.max(2, best - 1)).slice(0, 2);
    if (!picked.length) return REFUSAL;
    return `${picked.map((p) => p.sentence).join(" ")}\n${formatSources(picked.map((p) => p.docId))}`;
  }
}
