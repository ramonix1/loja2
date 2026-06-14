import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@lojao/test-utils', '@lojao/types'],
  async rewrites() {
    const apiUrl = (
      process.env.API_URL ??
      (process.env.GITHUB_ACTIONS === 'true' || process.env.SKIP_DOCKER_DEPS_SYNC === 'true'
        ? 'http://api:3001'
        : 'http://localhost:3001')
    ).replace(/\/$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
      {
        source: '/images/:path*',
        destination: `${apiUrl}/images/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
    ],
  },
};

export default nextConfig;
