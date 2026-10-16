/**
 * Gravador mínimo de Apache Parquet, sem dependências, para tabelas de colunas texto.
 *
 * Layout: "PAR1" | um row group com uma página de dados por coluna | FileMetaData | tamanho | "PAR1".
 * - colunas BYTE_ARRAY com anotação UTF8 (o pandas/pyarrow/datasets leem como string);
 * - todas REQUIRED (sem níveis de definição/repetição), codificação PLAIN, sem compressão;
 * - metadados serializados em Thrift Compact Protocol, como manda a especificação.
 * Para ~100 linhas isso é mais que suficiente e evita trazer uma dependência só para o dataset.
 */

// Tipos do Thrift Compact Protocol
const T_I32 = 5;
const T_I64 = 6;
const T_BINARY = 8;
const T_LIST = 9;
const T_STRUCT = 12;

// Enums do formato Parquet
const TYPE_BYTE_ARRAY = 6;
const REPETITION_REQUIRED = 0;
const CONVERTED_UTF8 = 0;
const ENCODING_PLAIN = 0;
const ENCODING_RLE = 3;
const CODEC_UNCOMPRESSED = 0;
const PAGE_DATA = 0;

class CompactWriter {
  private readonly bytes: number[] = [];
  private readonly lastField: number[] = [0];

  private varint(value: bigint): void {
    let v = value;
    while (v >= 0x80n) {
      this.bytes.push(Number((v & 0x7fn) | 0x80n));
      v >>= 7n;
    }
    this.bytes.push(Number(v));
  }

  private zigzag(value: number | bigint): void {
    const v = BigInt(value);
    this.varint(v >= 0n ? v << 1n : (-v << 1n) - 1n);
  }

  private fieldHeader(id: number, type: number): void {
    const delta = id - this.lastField[this.lastField.length - 1]!;
    if (delta > 0 && delta <= 15) {
      this.bytes.push((delta << 4) | type);
    } else {
      this.bytes.push(type);
      this.zigzag(id);
    }
    this.lastField[this.lastField.length - 1] = id;
  }

  i32(id: number, value: number): this {
    this.fieldHeader(id, T_I32);
    this.zigzag(value);
    return this;
  }

  i64(id: number, value: number): this {
    this.fieldHeader(id, T_I64);
    this.zigzag(value);
    return this;
  }

  string(id: number, value: string): this {
    this.fieldHeader(id, T_BINARY);
    const data = Buffer.from(value, "utf8");
    this.varint(BigInt(data.length));
    for (const b of data) this.bytes.push(b);
    return this;
  }

  struct(id: number, body: (w: CompactWriter) => void): this {
    this.fieldHeader(id, T_STRUCT);
    this.inlineStruct(body);
    return this;
  }

  private inlineStruct(body: (w: CompactWriter) => void): void {
    this.lastField.push(0);
    body(this);
    this.bytes.push(0); // STOP
    this.lastField.pop();
  }

  private listHeader(id: number, size: number, elemType: number): void {
    this.fieldHeader(id, T_LIST);
    if (size < 15) this.bytes.push((size << 4) | elemType);
    else {
      this.bytes.push(0xf0 | elemType);
      this.varint(BigInt(size));
    }
  }

  listI32(id: number, values: number[]): this {
    this.listHeader(id, values.length, T_I32);
    for (const v of values) this.zigzag(v);
    return this;
  }

  listString(id: number, values: string[]): this {
    this.listHeader(id, values.length, T_BINARY);
    for (const v of values) {
      const data = Buffer.from(v, "utf8");
      this.varint(BigInt(data.length));
      for (const b of data) this.bytes.push(b);
    }
    return this;
  }

  listStruct<T>(id: number, items: T[], body: (w: CompactWriter, item: T) => void): this {
    this.listHeader(id, items.length, T_STRUCT);
    for (const item of items) this.inlineStruct((w) => body(w, item));
    return this;
  }

  /** Fecha o struct de nível superior (STOP) e devolve os bytes. */
  toBuffer(): Buffer {
    return Buffer.from([...this.bytes, 0]);
  }
}

function plainByteArrays(values: string[]): Buffer {
  const parts: Buffer[] = [];
  for (const value of values) {
    const data = Buffer.from(value, "utf8");
    const len = Buffer.alloc(4);
    len.writeUInt32LE(data.length);
    parts.push(len, data);
  }
  return Buffer.concat(parts);
}

/** Serializa linhas (todas as colunas texto) em um arquivo Parquet. */
export function toParquet(rows: Array<Record<string, string>>, columns: string[]): Buffer {
  if (!rows.length) throw new Error("Parquet: nenhuma linha para gravar.");
  const magic = Buffer.from("PAR1", "ascii");
  const chunks: Buffer[] = [magic];
  let offset = magic.length;
  const columnMeta: Array<{ name: string; offset: number; size: number }> = [];

  for (const name of columns) {
    const values = rows.map((row) => {
      const v = row[name];
      if (typeof v !== "string") throw new Error(`Parquet: coluna "${name}" ausente ou não-texto.`);
      return v;
    });
    const data = plainByteArrays(values);
    const header = new CompactWriter()
      .i32(1, PAGE_DATA)
      .i32(2, data.length)
      .i32(3, data.length)
      .struct(5, (w) => w
        .i32(1, values.length)
        .i32(2, ENCODING_PLAIN)
        .i32(3, ENCODING_RLE)
        .i32(4, ENCODING_RLE))
      .toBuffer();
    columnMeta.push({ name, offset, size: header.length + data.length });
    chunks.push(header, data);
    offset += header.length + data.length;
  }

  const totalSize = columnMeta.reduce((sum, c) => sum + c.size, 0);
  const footer = new CompactWriter()
    .i32(1, 1)
    .listStruct(2, [null, ...columns], (w, name) => {
      if (name === null) {
        w.string(4, "schema").i32(5, columns.length);
      } else {
        w.i32(1, TYPE_BYTE_ARRAY).i32(3, REPETITION_REQUIRED).string(4, name).i32(6, CONVERTED_UTF8);
      }
    })
    .i64(3, rows.length)
    .listStruct(4, [null], (w) => {
      w.listStruct(1, columnMeta, (cw, col) => {
        cw.i64(2, col.offset).struct(3, (m) => m
          .i32(1, TYPE_BYTE_ARRAY)
          .listI32(2, [ENCODING_PLAIN, ENCODING_RLE])
          .listString(3, [col.name])
          .i32(4, CODEC_UNCOMPRESSED)
          .i64(5, rows.length)
          .i64(6, col.size)
          .i64(7, col.size)
          .i64(9, col.offset));
      });
      w.i64(2, totalSize).i64(3, rows.length);
    })
    .string(6, "corporate-knowledge-finetune-cli")
    .toBuffer();

  const footerLength = Buffer.alloc(4);
  footerLength.writeUInt32LE(footer.length);
  chunks.push(footer, footerLength, magic);
  return Buffer.concat(chunks);
}
