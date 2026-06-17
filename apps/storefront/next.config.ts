import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import { join } from 'node:path';

loadEnvConfig(join(process.cwd(), '../..'));

function r2RemotePattern(): { protocol: 'http' | 'https'; hostname: string; pathname: string } | null {
  const publicUrl = process.env.R2_PUBLIC_URL?.trim();
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

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@lojao/test-utils', '@lojao/types'],
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
};

export default nextConfig;
