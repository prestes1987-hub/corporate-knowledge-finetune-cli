import { resolve } from "node:path";

export interface Config {
  kbDir: string;
  /** Cobertura mínima (0..1) para um trecho entrar no contexto; abaixo disso não chama o LLM. */
  threshold: number;
  topK: number;
  debug: boolean;
  /** Força o LLM extrativo local mesmo com endpoint configurado. */
  offline: boolean;
  /**
   * Endpoint compatível com a API da OpenAI: a própria OpenAI, ou um servidor local
   * (Ollama, vLLM, llama.cpp) servindo o modelo fine-tunado — dados internos não saem da empresa.
   */
  llmBaseUrl?: string;
  llmApiKey?: string;
  llmModel: string;
}

try {
  process.loadEnvFile();
} catch {
  // .env é opcional
}

function num(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  return Number(value);
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const env = process.env;
  const config: Config = {
    kbDir: resolve(env.KB_DIR ?? "knowledge-base"),
    threshold: num(env.COVERAGE_THRESHOLD, 0.1),
    topK: num(env.TOP_K, 3),
    debug: env.DEBUG === "true",
    offline: env.OFFLINE === "true",
    llmBaseUrl: env.LLM_BASE_URL || (env.OPENAI_API_KEY ? "https://api.openai.com/v1" : undefined),
    llmApiKey: env.OPENAI_API_KEY || undefined,
    llmModel: env.LLM_MODEL ?? "gpt-5-mini"
  };
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) (config as unknown as Record<string, unknown>)[key] = value;
  }
  if (!(config.threshold >= 0 && config.threshold <= 1)) throw new Error("O threshold deve ser um número entre 0 e 1.");
  if (!(Number.isInteger(config.topK) && config.topK > 0)) throw new Error("O top-k deve ser um inteiro positivo.");
  return config;
}
