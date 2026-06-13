#!/usr/bin/env node
/**
 * Roda seed-dev via tsx resolvido no store .pnpm (sem depender de apps/api/node_modules).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findRepoRoot, resolvePnpmPackage } from '../../../scripts/pnpm-resolve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');
const repoRoot = findRepoRoot(pkgRoot);
const tsxCli = join(resolvePnpmPackage(repoRoot, 'tsx'), 'dist/cli.mjs');
const seedScript = join(here, 'seed-dev.mjs');
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [tsxCli, seedScript, ...args], {
  stdio: 'inherit',
  cwd: pkgRoot,
  env: process.env,
});

process.exit(result.status ?? 1);
