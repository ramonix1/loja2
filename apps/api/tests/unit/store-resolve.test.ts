import { describe, expect, it } from 'vitest';

import { resolveStoreSlug } from '../../src/plugins/store.js';

function mockRequest(overrides: {
  params?: { storeSlug?: string };
  headers?: Record<string, string>;
} = {}) {
  return {
    params: overrides.params,
    headers: overrides.headers ?? {},
  } as Parameters<typeof resolveStoreSlug>[0];
}

describe('resolveStoreSlug', () => {
  it('prioriza o path param storeSlug', () => {
    expect(
      resolveStoreSlug(
        mockRequest({ params: { storeSlug: 'camisetas' }, headers: { 'x-store-slug': 'canecas' } }),
      ),
    ).toBe('camisetas');
  });

  it('usa o header X-Store-Slug sem path param', () => {
    expect(resolveStoreSlug(mockRequest({ headers: { 'x-store-slug': 'canecas' } }))).toBe('canecas');
  });

  it('ignora path param em branco e cai para o header', () => {
    expect(
      resolveStoreSlug(mockRequest({ params: { storeSlug: '  ' }, headers: { 'x-store-slug': 'canecas' } })),
    ).toBe('canecas');
  });

  it('retorna null sem path param nem header', () => {
    expect(resolveStoreSlug(mockRequest())).toBeNull();
  });
});
