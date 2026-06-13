#!/usr/bin/env node
/**
 * Invoca o CLI do Playwright via resolução de módulo Node (sem depender de .bin no PATH).
 * Necessário no CI (pnpm + GHA) onde `playwright` no script falha com ENOENT.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');
const require = createRequire(join(pkgRoot, 'package.json'));

const cli = require.resolve('@playwright/test/cli');
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [cli, ...args], {
  stdio: 'inherit',
  cwd: pkgRoot,
  env: process.env,
});

process.exit(result.status ?? 1);
