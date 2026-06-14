import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('Admin chat', () => {
  let app: FastifyInstance;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/admin/chat/conversas: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/chat/conversas',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('GET bot-respostas: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/chat/bot-respostas',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('POST bot-resposta: 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/chat/bot-respostas',
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: { palavra_chave: 'preço, valor', resposta: 'Consulte nosso catálogo.' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.palavra_chave).toBe('preço, valor');
  });

  it('PUT bot-resposta: 200', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/chat/bot-respostas',
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: { palavra_chave: 'frete', resposta: 'Calculamos no checkout.' },
    });
    const id = create.json().data.id as number;

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/chat/bot-respostas/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: { palavra_chave: 'frete, entrega', resposta: 'Frete no checkout.' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.palavra_chave).toBe('frete, entrega');

    await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/chat/bot-respostas/${id}`,
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
  });

  it('GET mensagens conversa inexistente: 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/chat/conversas/999999/mensagens',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET sem sessão: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/chat/conversas',
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET como comprador: 403', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/chat/conversas',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
