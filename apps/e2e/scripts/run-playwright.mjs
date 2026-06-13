#!/usr/bin/env node
/**
 * Invoca o CLI do Playwright via store .pnpm (sem depender de apps/e2e/node_modules).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findRepoRoot, resolvePnpmPackage } from '../../../scripts/pnpm-resolve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');
const repoRoot = findRepoRoot(pkgRoot);
const cli = join(resolvePnpmPackage(repoRoot, '@playwright/test'), 'cli.js');
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [cli, ...args], {
  stdio: 'inherit',
  cwd: pkgRoot,
  env: process.env,
});

process.exit(result.status ?? 1);
