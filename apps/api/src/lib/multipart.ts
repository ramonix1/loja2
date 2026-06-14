import type { FastifyRequest } from 'fastify';

export interface ParsedMultipart {
  fields: Record<string, string>;
  file: { buffer: Buffer; mimetype: string; filename: string } | null;
}

/** Lê corpo multipart (campos + um arquivo opcional `imagem`). */
export async function parseMultipart(request: FastifyRequest): Promise<ParsedMultipart> {
  const fields: Record<string, string> = {};
  let file: ParsedMultipart['file'] = null;

  const parts = request.parts();
  for await (const part of parts) {
    if (part.type === 'file') {
      const chunks: Buffer[] = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }
      file = {
        buffer: Buffer.concat(chunks),
        mimetype: part.mimetype,
        filename: part.filename,
      };
    } else {
      fields[part.fieldname] = String(part.value);
    }
  }

  return { fields, file };
}

export interface ParsedFile {
  buffer: Buffer;
  mimetype: string;
  filename: string;
}

/** Lê corpo multipart com múltiplos arquivos (ex.: logo + favicon). */
export async function parseMultipartMulti(request: FastifyRequest): Promise<{
  fields: Record<string, string>;
  files: Record<string, ParsedFile>;
}> {
  const fields: Record<string, string> = {};
  const files: Record<string, ParsedFile> = {};

  const parts = request.parts();
  for await (const part of parts) {
    if (part.type === 'file') {
      const chunks: Buffer[] = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }
      files[part.fieldname] = {
        buffer: Buffer.concat(chunks),
        mimetype: part.mimetype,
        filename: part.filename,
      };
    } else {
      fields[part.fieldname] = String(part.value);
    }
  }

  return { fields, files };
}

/** Lê corpo multipart com todos os arquivos (ex.: `imagens` múltiplos). */
export async function parseMultipartAll(request: FastifyRequest): Promise<{
  fields: Record<string, string>;
  files: Array<ParsedFile & { fieldname: string }>;
}> {
  const fields: Record<string, string> = {};
  const files: Array<ParsedFile & { fieldname: string }> = [];

  const parts = request.parts();
  for await (const part of parts) {
    if (part.type === 'file') {
      const chunks: Buffer[] = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }
      files.push({
        fieldname: part.fieldname,
        buffer: Buffer.concat(chunks),
        mimetype: part.mimetype,
        filename: part.filename,
      });
    } else {
      fields[part.fieldname] = String(part.value);
    }
  }

  return { fields, files };
}
