import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('CRUD /api/v1/admin/categorias', () => {
  let app: FastifyInstance;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET lista como admin: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/categorias',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('POST criar + GET detalhe + PUT atualizar + DELETE: happy path', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/categorias',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
      payload: { nome: 'Categoria Teste API' },
    });
    expect(createRes.statusCode).toBe(201);
    const { id } = createRes.json().data as { id: number };

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/categorias/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().data.nome).toBe('Categoria Teste API');

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/categorias/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
      payload: { nome: 'Categoria Atualizada', ordem: 2, produtos_ids: [] },
    });
    expect(updateRes.statusCode).toBe(200);

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/categorias/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(deleteRes.statusCode).toBe(200);
  });

  it('sem autenticação: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/categorias',
      headers: { ...TENANT_HEADER },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('como usuário comum: 403', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/categorias',
      headers: { ...TENANT_HEADER, cookie },
      payload: { nome: 'Bloqueado' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
  });
});
