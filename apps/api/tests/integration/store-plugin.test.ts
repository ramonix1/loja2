import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { eq } from '@lojao/db';
import { products } from '@lojao/db/schema/merchant';

import { masterPool } from '../../src/lib/master-db.js';
import { invalidateMerchantPool } from '../../src/lib/merchant-db.js';
import { merchantDbName } from '../../src/lib/merchant-provision.js';
import { createMerchant } from '../../src/modules/merchants/merchant.service.js';
import type { Session } from '../../src/plugins/session.js';
import { publicStorePreHandler, storePreHandler } from '../../src/plugins/store.js';

/**
 * MA4 — prova o primitivo `resolveStore` (plugin `store.ts` + `lib/merchant-db.ts`):
 * resolução de loja por slug (vitrine) e por `session.storeId` (admin), e
 * isolamento real de dados por `store_id` dentro do mesmo banco físico de
 * merchant (duas lojas do mesmo merchant, mesmo pool, `store_id` diferente).
 *
 * Cria um merchant real (banco físico `atacommerce_*`, mesmo padrão de
 * `merchants.provision.test.ts`), sem depender de login/sessão real — MA5 é
 * quem vai popular `session.storeId`/`memberId` de verdade.
 */
const MERCHANT_SLUG = 'ma4-store-plugin-test';

interface StoreFixture {
  id: number;
  slug: string;
}

let storeA: StoreFixture;
let storeB: StoreFixture;
let inactiveStoreSlug: string;

async function dropMerchant(slug: string): Promise<void> {
  await invalidateMerchantPool(slug);
  await masterPool.query('DELETE FROM merchants WHERE slug = $1', [slug]);
  const dbName = merchantDbName(slug);
  await masterPool.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
}

async function insertStore(merchantId: number, slug: string, active: boolean): Promise<StoreFixture> {
  const result = await masterPool.query<{ id: number }>(
    `INSERT INTO stores (merchant_id, slug, name, active) VALUES ($1, $2, $3, $4) RETURNING id`,
    [merchantId, slug, `Loja ${slug}`, active],
  );
  return { id: result.rows[0]!.id, slug };
}

/** App mínimo (sem sessão real) — fakeia `session.storeId`/`memberId` via header p/ exercitar `storePreHandler`. */
function buildTestApp() {
  const app = Fastify({ logger: false });

  app.decorateRequest('session', null);
  app.addHook('onRequest', async (request) => {
    const storeIdHeader = request.headers['x-fake-store-id'];
    const memberIdHeader = request.headers['x-fake-member-id'];
    request.session = {
      storeId: typeof storeIdHeader === 'string' ? Number(storeIdHeader) : undefined,
      memberId: typeof memberIdHeader === 'string' ? Number(memberIdHeader) : undefined,
    } as Session;
  });

  app.get('/public/:storeSlug', { preHandler: publicStorePreHandler }, async (request) => ({
    merchantId: request.merchantId,
    merchantSlug: request.merchantSlug,
    storeId: request.storeId,
    storeSlug: request.storeSlug,
  }));

  app.get('/admin', { preHandler: storePreHandler }, async (request) => ({
    merchantId: request.merchantId,
    storeId: request.storeId,
    storeSlug: request.storeSlug,
  }));

  app.post<{ Params: { storeSlug: string }; Body: { name: string } }>(
    '/public/:storeSlug/products',
    { preHandler: publicStorePreHandler },
    async (request) => {
      const [row] = await request
        .merchantDb!.insert(products)
        .values({ storeId: request.storeId!, name: request.body.name })
        .returning();
      return { id: row!.id };
    },
  );

  app.get<{ Params: { storeSlug: string } }>(
    '/public/:storeSlug/products',
    { preHandler: publicStorePreHandler },
    async (request) => {
      const rows = await request
        .merchantDb!.select({ id: products.id, name: products.name })
        .from(products)
        .where(eq(products.storeId, request.storeId!));
      return { data: rows };
    },
  );

  return app;
}

describe('MA4 — plugin resolveStore (publicStorePreHandler/storePreHandler)', () => {
  beforeAll(async () => {
    await dropMerchant(MERCHANT_SLUG);

    const result = await createMerchant({ slug: MERCHANT_SLUG, name: 'Merchant Store Plugin Teste' });
    if (!result.ok) throw new Error('Falha ao criar merchant de teste');

    storeA = await insertStore(result.merchant.id, 'ma4-store-a', true);
    storeB = await insertStore(result.merchant.id, 'ma4-store-b', true);
    const inactive = await insertStore(result.merchant.id, 'ma4-store-inactive', false);
    inactiveStoreSlug = inactive.slug;
  });

  afterAll(async () => {
    await dropMerchant(MERCHANT_SLUG);
  });

  it('publicStorePreHandler resolve merchantId/storeId pelo slug da loja', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: `/public/${storeA.slug}` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ merchantSlug: MERCHANT_SLUG, storeId: storeA.id, storeSlug: storeA.slug });
  });

  it('publicStorePreHandler 404 STORE_NOT_FOUND para slug inexistente', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/public/slug-que-nao-existe' });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('STORE_NOT_FOUND');
  });

  it('publicStorePreHandler 404 STORE_NOT_FOUND para loja inativa', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: `/public/${inactiveStoreSlug}` });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('STORE_NOT_FOUND');
  });

  it('storePreHandler resolve pela session.storeId (loja B)', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/admin',
      headers: { 'x-fake-store-id': String(storeB.id) },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ storeId: storeB.id, storeSlug: storeB.slug });
  });

  it('storePreHandler 404 STORE_NOT_FOUND sem session.storeId nem memberId', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/admin' });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('STORE_NOT_FOUND');
  });

  it('storePreHandler 403 STORE_NOT_SELECTED com memberId mas sem storeId', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/admin',
      headers: { 'x-fake-member-id': '1' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('STORE_NOT_SELECTED');
  });

  it('isola dados por store_id no mesmo merchantDb (loja A não vê produto da loja B)', async () => {
    const app = buildTestApp();

    const createA = await app.inject({
      method: 'POST',
      url: `/public/${storeA.slug}/products`,
      payload: { name: 'Produto da Loja A' },
    });
    expect(createA.statusCode).toBe(200);

    const createB = await app.inject({
      method: 'POST',
      url: `/public/${storeB.slug}/products`,
      payload: { name: 'Produto da Loja B' },
    });
    expect(createB.statusCode).toBe(200);

    const listA = await app.inject({ method: 'GET', url: `/public/${storeA.slug}/products` });
    const listB = await app.inject({ method: 'GET', url: `/public/${storeB.slug}/products` });

    expect(listA.json().data).toEqual([{ id: expect.any(Number), name: 'Produto da Loja A' }]);
    expect(listB.json().data).toEqual([{ id: expect.any(Number), name: 'Produto da Loja B' }]);
  });
});
