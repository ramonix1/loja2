import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

const { Pool } = pg;

// JPEG mínimo válido (1x1)
const MIN_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
  'base64',
);

describe('CRUD /api/v1/admin/produtos', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let db: pg.Pool;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
    db = new Pool({
      connectionString:
        process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao',
      ssl: false,
    });
  });

  afterAll(async () => {
    await app.close();
    await db.end();
  });

  it('GET lista como admin: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/produtos',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('POST sem imagens: 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/produtos',
      headers: {
        ...TENANT_HEADER,
        cookie: adminCookie,
        'content-type': 'multipart/form-data; boundary=----nopic',
      },
      payload:
        '------nopic\r\nContent-Disposition: form-data; name="nome"\r\n\r\nProduto Teste\r\n' +
        '------nopic\r\nContent-Disposition: form-data; name="valor"\r\n\r\n10.00\r\n------nopic--\r\n',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('CRUD happy path + estoque + imagem', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/produtos',
      headers: {
        ...TENANT_HEADER,
        cookie: adminCookie,
        'content-type': 'multipart/form-data; boundary=----crt',
      },
      payload:
        '------crt\r\nContent-Disposition: form-data; name="nome"\r\n\r\nProduto Vitest\r\n' +
        '------crt\r\nContent-Disposition: form-data; name="valor"\r\n\r\n25.90\r\n' +
        '------crt\r\nContent-Disposition: form-data; name="imagens"; filename="t.jpg"\r\n' +
        'Content-Type: image/jpeg\r\n\r\n' +
        MIN_JPEG.toString('binary') +
        '\r\n------crt--\r\n',
    });
    expect(createRes.statusCode).toBe(201);
    const id = createRes.json().data.id as number;

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/produtos/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().data.nome).toBe('Produto Vitest');
    expect(getRes.json().data.imagens.length).toBeGreaterThan(0);

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/produtos/${id}`,
      headers: {
        ...TENANT_HEADER,
        cookie: adminCookie,
        'content-type': 'multipart/form-data; boundary=----upd',
      },
      payload:
        '------upd\r\nContent-Disposition: form-data; name="nome"\r\n\r\nProduto Atualizado\r\n' +
        '------upd\r\nContent-Disposition: form-data; name="valor"\r\n\r\n30.00\r\n------upd--\r\n',
    });
    expect(updateRes.statusCode).toBe(200);

    const estoqueRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/produtos/${id}/estoque`,
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: JSON.stringify({ estoque: 10 }),
    });
    expect(estoqueRes.statusCode).toBe(200);

    const imagemId = getRes.json().data.imagens[0].id as number;
    const delImgRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/produtos/imagens/${imagemId}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(delImgRes.statusCode).toBe(200);

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/produtos/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(deleteRes.statusCode).toBe(200);
  });

  it('GET sem sessão: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/produtos',
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET como comprador: 403', async () => {
    const userCookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/produtos',
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
