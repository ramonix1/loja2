/**
 * Carrega `.env` da raiz do monorepo antes de qualquer pool PostgreSQL.
 * Deve ser o primeiro import em entrypoints da API (imports estáticos rodam antes do corpo do módulo).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { getMonorepoRoot } from './lib/monorepo-root.js';

const monorepoRoot = getMonorepoRoot();
const rootEnv = join(monorepoRoot, '.env');

if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}
