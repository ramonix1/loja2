import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runMigrations } from './client.js';

const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const rootEnv = join(monorepoRoot, '.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

await runMigrations();
console.log('[@lojao/db] Migrations aplicadas com sucesso.');
