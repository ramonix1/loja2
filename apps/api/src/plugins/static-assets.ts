import fs from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { getLocalUploadDir } from "../adapters/storage/local-image-storage.js";
import { mimeFromFilename } from "../lib/image-mime.js";

/** Base pública CDN quando `R2_DELIVERY=cdn` — produção não faz proxy de bytes. */
export function resolveCdnPublicBase(): string | null {
  const delivery = (process.env.R2_DELIVERY ?? "proxy").trim().toLowerCase();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim();
  if (delivery === "cdn" && publicUrl) {
    return publicUrl.replace(/\/$/, "");
  }
  return null;
}

/**
 * `/images/*` — dev/local: serve disco ou proxy R2.
 * Produção (`R2_DELIVERY=cdn`): redirect 301 para CDN (sem ler R2/disco na memória).
 */
export async function registerStaticAssets(
  app: FastifyInstance,
): Promise<void> {
  const cdnBase = resolveCdnPublicBase();
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

    if (cdnBase) {
      return reply.redirect(`${cdnBase}/images/${filename}`, 301);
    }

    const url = `/images/${filename}`;
    const cacheHeader = { "Cache-Control": "public, max-age=86400, immutable" };

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
