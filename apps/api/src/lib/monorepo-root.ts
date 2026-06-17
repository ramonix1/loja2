import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Raiz do monorepo (`loja2/` — onde ficam `.env`, `data/`, `docker-compose.yml`). */
export function getMonorepoRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '../../../..');
}
