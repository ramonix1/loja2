#!/usr/bin/env node
/**
 * Roda seed-dev via tsx com resolução de módulo Node (sem depender de .bin no PATH).
 * Mesmo padrão de apps/e2e/scripts/run-playwright.mjs — necessário no CI (pnpm + GHA).
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');
const require = createRequire(join(pkgRoot, 'package.json'));

const tsxCli = require.resolve('tsx/cli');
const seedScript = join(here, 'seed-dev.mjs');
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [tsxCli, seedScript, ...args], {
  stdio: 'inherit',
  cwd: pkgRoot,
  env: process.env,
});

process.exit(result.status ?? 1);
