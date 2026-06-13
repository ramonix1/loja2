import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Sobe até achar pnpm-workspace.yaml (raiz do monorepo). */
export function findRepoRoot(fromDir) {
  let dir = fromDir;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error('pnpm-workspace.yaml não encontrado');
    }
    dir = parent;
  }
}

/**
 * Resolve pacote no store .pnpm (funciona sem symlinks em apps por pacote).
 * Ex.: resolvePnpmPackage(root, 'tsx') → .../.pnpm/tsx@4.x/node_modules/tsx
 */
export function resolvePnpmPackage(repoRoot, packageName) {
  const pnpmDir = join(repoRoot, 'node_modules/.pnpm');
  if (!existsSync(pnpmDir)) {
    throw new Error(`Store pnpm ausente em ${pnpmDir}. Rode "pnpm install" na raiz.`);
  }

  const prefix = packageName.startsWith('@')
    ? `${packageName.replace('/', '+')}@`
    : `${packageName}@`;

  const entry = readdirSync(pnpmDir).find((name) => name.startsWith(prefix));
  if (!entry) {
    throw new Error(`Pacote "${packageName}" não encontrado em ${pnpmDir}`);
  }

  return join(pnpmDir, entry, 'node_modules', packageName);
}
