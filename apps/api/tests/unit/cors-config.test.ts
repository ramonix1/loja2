import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { collectCorsOrigins, isOriginAllowed, normalizeOrigin } from '../../src/lib/cors-config.js';

describe('cors-config', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, NODE_ENV: 'test' };
    delete process.env.CORS_ORIGINS;
    delete process.env.APP_URL;
    delete process.env.ADMIN_URL;
    delete process.env.STOREFRONT_URL;
  });

  afterEach(() => {
    process.env = env;
  });

  it('normalizeOrigin remove barra final', () => {
    expect(normalizeOrigin('https://app.example.com/')).toBe('https://app.example.com');
  });

  it('collectCorsOrigins agrega envs e CORS_ORIGINS', () => {
    process.env.APP_URL = 'https://atalabs.com.br/';
    process.env.ADMIN_URL = 'https://app.atalabs.com.br';
    process.env.CORS_ORIGINS = 'https://extra.example.com, ';

    expect(collectCorsOrigins()).toEqual([
      'https://extra.example.com',
      'https://atalabs.com.br',
      'https://app.atalabs.com.br',
    ]);
  });

  it('isOriginAllowed aceita origem da allowlist em test/prod', () => {
    process.env.ADMIN_URL = 'https://app.atalabs.com.br';
    expect(isOriginAllowed('https://app.atalabs.com.br')).toBe(true);
    expect(isOriginAllowed('https://evil.example.com')).toBe(false);
  });

  it('isOriginAllowed libera localhost em dev', () => {
    process.env.NODE_ENV = 'development';
    expect(isOriginAllowed('http://127.0.0.1:5173')).toBe(true);
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
  });

  it('isOriginAllowed rejeita localhost em produção sem allowlist', () => {
    process.env.NODE_ENV = 'production';
    process.env.APP_URL = 'https://atalabs.com.br';
    expect(isOriginAllowed('http://localhost:5173')).toBe(false);
    expect(isOriginAllowed('https://atalabs.com.br')).toBe(true);
  });

  it('isOriginAllowed aceita request sem Origin (SSR/curl)', () => {
    expect(isOriginAllowed(undefined)).toBe(true);
  });
});
