/** Contrato de armazenamento de imagens — inversão de dependência (hexagonal). */
export type StorageProvider = 'local' | 'r2';

export interface ImageUploadInput {
  buffer: Buffer;
  originalFilename: string;
  mimetype: string;
}

export interface ImageReadResult {
  body: Buffer;
  contentType: string;
}

export interface ImageStorage {
  readonly provider: StorageProvider;
  save(input: ImageUploadInput): Promise<string>;
  delete(url: string): Promise<void>;
  /** Lê imagem para servir via `/images/*` (proxy quando bucket é privado). */
  read(url: string): Promise<ImageReadResult | null>;
}
