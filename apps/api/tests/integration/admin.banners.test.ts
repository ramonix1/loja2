import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { merchantDbName, merchantPoolConfig } from '../../src/lib/merchant-provision.js';
import { masterPool } from '../../src/lib/master-db.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';
import { TEST_PRIMARY_MERCHANT_SLUG, TEST_STORE_SLUG } from '../helpers/seed.js';

describe('CRUD /api/v1/admin/banners', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let db: pg.Pool;
  let storeId: number;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
    const storeRes = await masterPool.query<{ id: number }>(
      'SELECT id FROM stores WHERE slug = $1',
      [TEST_STORE_SLUG],
    );
    storeId = storeRes.rows[0]!.id;
    db = new pg.Pool(merchantPoolConfig(merchantDbName(TEST_PRIMARY_MERCHANT_SLUG)));
  });

  afterAll(async () => {
    await app.close();
    await db.end();
  });

  it('GET lista como admin: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/banners',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('GET form-options: 200 com produtos[]', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/banners/form-options',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data.produtos)).toBe(true);
  });

  it('POST sem imagem: 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/banners',
      headers: {
        ...TENANT_HEADER,
        cookie: adminCookie,
        'content-type': 'multipart/form-data; boundary=----test',
      },
      payload:
        '------test\r\nContent-Disposition: form-data; name="titulo"\r\n\r\nBanner Teste\r\n------test--\r\n',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('PUT atualizar campos + DELETE: happy path', async () => {
    const ins = await db.query(
      `INSERT INTO banners (store_id, title, image, active, "order")
       VALUES ($1, $2, $3, true, 0) RETURNING id`,
      [storeId, 'Banner Vitest', '/images/test-vitest.jpg'],
    );
    const id = ins.rows[0].id as number;

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/banners/${id}`,
      headers: {
        ...TENANT_HEADER,
        cookie: adminCookie,
        'content-type': 'multipart/form-data; boundary=----upd',
      },
      payload:
        `------upd\r\nContent-Disposition: form-data; name="titulo"\r\n\r\nBanner Atualizado\r\n` +
        `------upd\r\nContent-Disposition: form-data; name="ordem"\r\n\r\n1\r\n` +
        `------upd\r\nContent-Disposition: form-data; name="ativo"\r\n\r\ntrue\r\n------upd--\r\n`,
    });
    expect(updateRes.statusCode).toBe(200);

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/banners/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(getRes.json().data.titulo).toBe('Banner Atualizado');

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/banners/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(deleteRes.statusCode).toBe(200);
  });

  it('sem autenticação: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/banners',
      headers: { ...TENANT_HEADER },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('STORE_NOT_FOUND');
  });

  it('como usuário comum: 403', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/banners',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });
});
