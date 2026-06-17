import path from "node:path";

import { AwsClient } from "aws4fetch";

import {
  assertValidImage,
  buildImageFilename,
} from "../../lib/image-validation.js";
import { mimeFromFilename } from "../../lib/image-mime.js";
import type {
  ImageReadResult,
  ImageStorage,
  ImageUploadInput,
} from "../../ports/image-storage.js";

const OBJECT_PREFIX = "images/";

export type R2DeliveryMode = "proxy" | "cdn";

function normalizePublicBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Extrai a object key S3 a partir da URL pública ou path `/images/...`. */
export function resolveR2ObjectKey(
  url: string,
  publicBaseUrl = "",
): string | null {
  if (url.startsWith("/images/")) {
    return `${OBJECT_PREFIX}${path.basename(url)}`;
  }

  if (!publicBaseUrl) return null;

  const base = normalizePublicBaseUrl(publicBaseUrl);
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  if (!url.startsWith(base)) return null;

  const key = url.slice(base.length).replace(/^\//, "");
  return key.startsWith(OBJECT_PREFIX) ? key : null;
}

export interface R2ImageStorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** `proxy`: grava no R2, retorna `/images/...` (API serve). `cdn`: retorna URL pública. */
  delivery: R2DeliveryMode;
  publicBaseUrl?: string;
}

export class R2ImageStorage implements ImageStorage {
  readonly provider = "r2" as const;

  private readonly client: AwsClient;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly delivery: R2DeliveryMode;
  private readonly publicBaseUrl: string;

  constructor(config: R2ImageStorageConfig) {
    this.bucket = config.bucket;
    this.delivery = config.delivery;
    this.publicBaseUrl = config.publicBaseUrl
      ? normalizePublicBaseUrl(config.publicBaseUrl)
      : "";
    this.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
    this.client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: "s3",
      region: "auto",
    });
  }

  private objectUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async save(input: ImageUploadInput): Promise<string> {
    assertValidImage(input.buffer, input.mimetype);
    const filename = buildImageFilename(input.originalFilename);
    const key = `${OBJECT_PREFIX}${filename}`;

    const res = await this.client.fetch(this.objectUrl(key), {
      method: "PUT",
      body: input.buffer,
      headers: { "Content-Type": input.mimetype },
    });

    if (!res.ok) {
      throw new Error(`Falha ao enviar imagem para R2 (${res.status}).`);
    }

    if (this.delivery === "cdn") {
      if (!this.publicBaseUrl) {
        throw new Error(
          "R2_DELIVERY=cdn exige R2_PUBLIC_URL (domínio customizado).",
        );
      }
      return `${this.publicBaseUrl}/${key}`;
    }

    return `/images/${filename}`;
  }

  async delete(url: string): Promise<void> {
    const key = resolveR2ObjectKey(url, this.publicBaseUrl);
    if (!key) return;

    try {
      await this.client.fetch(this.objectUrl(key), { method: "DELETE" });
    } catch {}
  }

  async read(url: string): Promise<ImageReadResult | null> {
    const key = resolveR2ObjectKey(url, this.publicBaseUrl);
    if (!key) return null;

    const res = await this.client.fetch(this.objectUrl(key), { method: "GET" });
    if (!res.ok) return null;

    const body = Buffer.from(await res.arrayBuffer());
    const contentType =
      res.headers.get("content-type") ?? mimeFromFilename(key);
    return { body, contentType };
  }
}
