import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveSlug } from '../../src/plugins/tenant.js';

function mockRequest(overrides: {
  session?: { tenantSlug?: string };
  headers?: Record<string, string>;
  hostname?: string;
  log?: { warn: ReturnType<typeof vi.fn> };
} = {}) {
  return {
    session: overrides.session,
    headers: overrides.headers ?? {},
    hostname: overrides.hostname ?? 'localhost',
    log: overrides.log ?? { warn: vi.fn() },
  } as Parameters<typeof resolveSlug>[0];
}

describe('resolveSlug', () => {
  const prev = process.env.TENANT_SLUG;

  afterEach(() => {
    if (prev === undefined) delete process.env.TENANT_SLUG;
    else process.env.TENANT_SLUG = prev;
    process.env.NODE_ENV = 'test';
  });

  it('prioriza sessão', () => {
    expect(resolveSlug(mockRequest({ session: { tenantSlug: 'acme' } }))).toBe('acme');
  });

  it('usa header X-Tenant-Slug antes de env em test', () => {
    process.env.TENANT_SLUG = 'loja';
    process.env.NODE_ENV = 'test';
    expect(resolveSlug(mockRequest({ headers: { 'x-tenant-slug': 'demo' } }))).toBe('demo');
  });

  it('ignora TENANT_SLUG em produção', () => {
    process.env.TENANT_SLUG = 'loja';
    process.env.NODE_ENV = 'production';
    const log = { warn: vi.fn() };
    expect(resolveSlug(mockRequest({ headers: {}, log }))).toBeNull();
    expect(log.warn).toHaveBeenCalled();
  });

  it('retorna null sem slug identificável', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TENANT_SLUG;
    expect(resolveSlug(mockRequest())).toBeNull();
  });
});
