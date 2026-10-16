/** Utilidades de texto compartilhadas pela base de conhecimento, pela busca e pelo dataset. */

const STOPWORDS = new Set(`
a o e as os um uma uns umas de da do das dos em no na nos nas ao aos para pra por pelo pela pelos pelas
com sem sobre entre ate apos que qual quais quanto quantos quantas como quando onde quem porque se ou mas mais menos muito
ja nao sim isso isto esse essa este esta aquele aquela eu voce voces ele ela eles elas me te lhe
meu minha meus minhas seu sua seus suas ser sao foi sera estar estao ter tem tenho ha
faco fazer faz preciso precisa posso pode podem devo deve gostaria quero queria saber existe existem
vc vcs favor ola oi bom boa dia tarde noite empresa lumora colaborador colaboradores
`.trim().split(/\s+/));

/** Minúsculas, sem acentos e sem caracteres invisíveis. Ordinais (85º) viram número puro. */
export function normalize(text: string): string {
  return text
    .replace(/[ºª°]/g, " ")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[​-‍⁠﻿­]/g, "")
    .toLowerCase();
}

/**
 * Forma canônica usada para comparar fatos (a mesma regra está em `colab/avaliacao.py`):
 * tudo que não é letra/dígito vira espaço, então "R$ 1.000,00" → "r 1 000 00".
 */
export function canonical(text: string): string {
  return normalize(text).replace(/[^a-z0-9]+/g, " ").trim();
}

const SUFFIXES = ["amentos", "imentos", "amento", "imento", "acoes", "icoes", "mente", "acao", "icao",
  "ados", "idos", "ado", "ido", "am", "em", "ar", "er", "ir", "es", "as", "os", "a", "e", "o", "s"];

/** Stemmer leve para português: aproxima "reembolsar"/"reembolso", "férias"/"feria" etc. */
export function stem(word: string): string {
  if (word.endsWith("ns") && word.length > 5) word = `${word.slice(0, -2)}m`; // passagens → passagem
  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) return word.slice(0, -suffix.length);
  }
  return word;
}

/** Termos de busca: normalizados, sem stopwords e reduzidos ao radical. */
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .map(stem);
}

/** Frases completas de um trecho. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú0-9])|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && /[.!?]$/.test(s));
}
