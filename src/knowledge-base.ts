import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

/** Um documento interno (política, processo ou manual) com metadados de governança. */
export interface KbDocument {
  id: string;
  title: string;
  area: string;
  version: string;
  effectiveDate: string;
  file: string;
}

/**
 * Unidade de contexto: uma seção numerada ("## 2. Fracionamento") de um documento.
 * Seções de política são curtas e autocontidas, então a seção inteira é o trecho —
 * nenhuma regra fica cortada pela metade.
 */
export interface Chunk {
  /** Identificador estável da seção, ex.: "POL-FERIAS §2". */
  id: string;
  docId: string;
  docTitle: string;
  heading: string;
  text: string;
}

export interface KnowledgeBase {
  documents: KbDocument[];
  chunks: Chunk[];
}

function parseFrontMatter(raw: string, file: string): { meta: Record<string, string>; body: string } {
  const match = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: cabeçalho (front matter) ausente.`);
  const meta: Record<string, string> = {};
  for (const line of match[1]!.split("\n")) {
    const sep = line.indexOf(":");
    if (sep > 0) meta[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
  }
  return { meta, body: match[2]! };
}

export function loadKnowledgeBase(dir: string): KnowledgeBase {
  const documents: KbDocument[] = [];
  const chunks: Chunk[] = [];
  const files = readdirSync(dir).filter((f) => /\.(md|txt)$/i.test(f)).sort();
  if (!files.length) throw new Error(`Nenhum documento .md/.txt em ${dir}.`);

  for (const file of files) {
    const { meta, body } = parseFrontMatter(readFileSync(join(dir, file), "utf8"), file);
    const doc: KbDocument = {
      id: meta.id ?? basename(file).replace(/\.\w+$/, ""),
      title: meta.titulo ?? file,
      area: meta.area ?? "",
      version: meta.versao ?? "",
      effectiveDate: meta.vigencia ?? "",
      file
    };
    if (documents.some((d) => d.id === doc.id)) throw new Error(`ID de documento duplicado: ${doc.id}`);
    documents.push(doc);

    for (const block of body.split(/^## /m).slice(1)) {
      const [headingLine = "", ...rest] = block.split("\n");
      const heading = headingLine.trim();
      const number = heading.match(/^(\d+)\./)?.[1];
      if (!number) throw new Error(`${file}: seção sem numeração ("${heading}").`);
      chunks.push({
        id: `${doc.id} §${number}`,
        docId: doc.id,
        docTitle: doc.title,
        heading,
        text: rest.join("\n").trim()
      });
    }
  }
  return { documents, chunks };
}

export function docIdOf(chunkId: string): string {
  return chunkId.split(" §")[0]!;
}
