import { describe, expect, it } from 'vitest';

import {
  buildStorePath,
  getDefaultStoreSlug,
  isStorePath,
  normalizePathname,
  parseStorePath,
  STORE_PREFIX,
} from './index.js';

describe('parseStorePath', () => {
  it('extrai slug e subpath', () => {
    expect(parseStorePath('/store/loja')).toEqual({ slug: 'loja', storePath: '/' });
    expect(parseStorePath('/store/loja/')).toEqual({ slug: 'loja', storePath: '/' });
    expect(parseStorePath('/store/demo/carrinho')).toEqual({
      slug: 'demo',
      storePath: '/carrinho',
    });
    expect(parseStorePath('/store/acme/produto/42')).toEqual({
      slug: 'acme',
      storePath: '/produto/42',
    });
  });

  it('retorna null fora de /store', () => {
    expect(parseStorePath('/')).toEqual({ slug: null, storePath: null });
    expect(parseStorePath('/pricing')).toEqual({ slug: null, storePath: null });
    expect(parseStorePath('/produto/1')).toEqual({ slug: null, storePath: null });
  });

  it('ignora query e hash', () => {
    expect(parseStorePath('/store/loja/carrinho?x=1')).toEqual({
      slug: 'loja',
      storePath: '/carrinho',
    });
    expect(parseStorePath('/store/loja/login#form')).toEqual({
      slug: 'loja',
      storePath: '/login',
    });
  });
});

describe('buildStorePath', () => {
  it('monta home e subpaths', () => {
    expect(buildStorePath('loja')).toBe('/store/loja');
    expect(buildStorePath('loja', '/')).toBe('/store/loja');
    expect(buildStorePath('demo', '/carrinho')).toBe('/store/demo/carrinho');
    expect(buildStorePath('demo', 'produto/1')).toBe('/store/demo/produto/1');
  });

  it('rejeita slug vazio', () => {
    expect(() => buildStorePath('')).toThrow(/slug/);
  });
});

describe('roundtrip', () => {
  it('parse(build(slug, sub)) preserva slug e subpath', () => {
    const built = buildStorePath('acme', '/checkout/resultado/9');
    expect(parseStorePath(built)).toEqual({
      slug: 'acme',
      storePath: '/checkout/resultado/9',
    });
  });
});

describe('getDefaultStoreSlug', () => {
  it('usa env quando definido', () => {
    expect(getDefaultStoreSlug({ NEXT_PUBLIC_DEFAULT_STORE_SLUG: 'minha-loja' })).toBe(
      'minha-loja',
    );
  });

  it('fallback prod demo / dev loja', () => {
    expect(getDefaultStoreSlug({ NODE_ENV: 'production' })).toBe('demo');
    expect(getDefaultStoreSlug({ NODE_ENV: 'development' })).toBe('loja');
  });
});

describe('normalizePathname', () => {
  it('remove trailing slash e query', () => {
    expect(normalizePathname('/store/loja/')).toBe('/store/loja');
    expect(normalizePathname('store/loja')).toBe('/store/loja');
  });
});

describe('isStorePath', () => {
  it('detecta rotas store', () => {
    expect(isStorePath('/store/loja')).toBe(true);
    expect(isStorePath('/')).toBe(false);
  });
});

describe('STORE_PREFIX', () => {
  it('é /store', () => {
    expect(STORE_PREFIX).toBe('/store');
  });
});
