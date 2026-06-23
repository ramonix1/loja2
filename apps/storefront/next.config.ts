import { existsSync } from 'node:fs';
import { join } from 'node:path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const monorepoEnv = join(process.cwd(), '../..', '.env');
if (existsSync(monorepoEnv)) {
  process.loadEnvFile(monorepoEnv);
}

const storefrontRoot = path.dirname(fileURLToPath(import.meta.url));
const uiSrc = path.join(storefrontRoot, '../../packages/ui/src');

function r2RemotePattern(): { protocol: 'http' | 'https'; hostname: string; pathname: string } | null {
  const publicUrl = (process.env.NEXT_PUBLIC_CDN_URL ?? process.env.R2_PUBLIC_URL)?.trim();
  if (!publicUrl) return null;
  try {
    const parsed = new URL(publicUrl);
    return {
      protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
      hostname: parsed.hostname,
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

/** Resolve `@/` interno de `@lojao/ui` sem colidir com `@/` da vitrine. */
function uiPackageAliases() {
  return {
    '@/components/ui': path.join(uiSrc, 'components/ui'),
    '@/lib/utils': path.join(uiSrc, 'lib/utils.ts'),
  } as const;
}

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@lojao/ui', '@lojao/test-utils', '@lojao/types'],
  // Proxy /api/v1 e /images → API via Route Handlers (runtime), não rewrites build-time.
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' },
      { protocol: 'https', hostname: '*.onrender.com', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: '*.r2.dev', pathname: '/**' },
      ...(r2RemotePattern() ? [r2RemotePattern()!] : []),
    ],
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...uiPackageAliases(),
    };
    return config;
  },
  turbopack: {
    resolveAlias: uiPackageAliases(),
  },
};

export default nextConfig;
