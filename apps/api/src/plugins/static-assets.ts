import fs from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { getLocalUploadDir } from "../adapters/storage/local-image-storage.js";
import { mimeFromFilename } from "../lib/image-mime.js";

/**
 * Serve uploads em `/images/*`.
 * Ordem: disco local (legado/dev) → R2 via `app.imageStorage.read()` (modo proxy).
 */
export async function registerStaticAssets(
  app: FastifyInstance,
): Promise<void> {
  const root = getLocalUploadDir();
  await fs.mkdir(root, { recursive: true });

  app.get("/images/*", async (request: FastifyRequest, reply: FastifyReply) => {
    const wildcard = (request.params as { "*": string })["*"] ?? "";
    const filename = path.basename(wildcard);
    if (!filename || filename.includes("..")) {
      return reply
        .code(400)
        .send({ error: "Caminho inválido.", code: "VALIDATION_ERROR" });
    }

    const url = `/images/${filename}`;

    const cacheHeader = { 'Cache-Control': 'public, max-age=86400, immutable' };

    try {
      const body = await fs.readFile(path.join(root, filename));
      return reply
        .headers(cacheHeader)
        .type(mimeFromFilename(filename))
        .send(body);
    } catch {}

    const fromStorage = await app.imageStorage.read(url);
    if (fromStorage) {
      return reply
        .headers(cacheHeader)
        .type(fromStorage.contentType)
        .send(fromStorage.body);
    }

    return reply
      .code(404)
      .send({ error: "Imagem não encontrada.", code: "NOT_FOUND" });
  });
}
