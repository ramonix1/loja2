import type { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atalabs.com.br').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/store/*/checkout',
          '/store/*/meus-pedidos',
          '/store/*/dashboard',
          '/store/*/login',
          '/store/*/cadastro',
          '/store/*/recuperar-senha',
          '/store/*/redefinir-senha',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
