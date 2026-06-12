import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { getTestPedidoId } from '../helpers/fixture-ids.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('GET /api/v1/admin/pedidos', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('como admin: 200 paginado (meta.total + data[])', async () => {
    const cookie = await loginAdminCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/pedidos?page=1&perPage=10',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.page).toBe(1);
    expect(body.meta.perPage).toBe(10);
    expect(typeof body.meta.total).toBe('number');
    if (body.data.length > 0) {
      expect(typeof body.data[0].total_itens).toBe('number');
      expect('metodo_pagamento' in body.data[0]).toBe(true);
    }
  });

  it('filtro status=pago: 200 com meta.status', async () => {
    const cookie = await loginAdminCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/pedidos?status=pago',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.meta.status).toBe('pago');
    for (const row of body.data) {
      expect(row.status).toBe('pago');
    }
  });

  it('sem autenticação: 401 UNAUTHORIZED', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/pedidos',
      headers: { ...TENANT_HEADER },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('UNAUTHORIZED');
  });

  it('como usuário comum: 403 FORBIDDEN', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/pedidos',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN');
  });
});

describe('GET /api/v1/admin/pedidos/:id', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('como admin: 200 com itens e cliente', async () => {
    expect(getTestPedidoId()).toBeGreaterThan(0);
    const cookie = await loginAdminCookie(app);
    const pedidoId = getTestPedidoId();
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/pedidos/${pedidoId}`,
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(200);
    const { data } = res.json();
    expect(data.id).toBe(pedidoId);
    expect(Array.isArray(data.itens)).toBe(true);
    expect(data.itens.length).toBeGreaterThan(0);
    expect(data.usuario_nome).toBeTruthy();
  });

  it('pedido inexistente: 404 NOT_FOUND', async () => {
    const cookie = await loginAdminCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/pedidos/999999',
      headers: { ...TENANT_HEADER, cookie },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('NOT_FOUND');
  });
});

describe('PATCH /api/v1/admin/pedidos/:id/status', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('como admin: 200 atualiza status', async () => {
    expect(getTestPedidoId()).toBeGreaterThan(0);
    const cookie = await loginAdminCookie(app);
    const pedidoId = getTestPedidoId();
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/pedidos/${pedidoId}/status`,
      headers: { ...TENANT_HEADER, cookie, 'content-type': 'application/json' },
      payload: { status: 'em_separacao' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('em_separacao');
  });

  it('status inválido: 400 VALIDATION_ERROR', async () => {
    const cookie = await loginAdminCookie(app);
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/pedidos/${getTestPedidoId()}/status`,
      headers: { ...TENANT_HEADER, cookie, 'content-type': 'application/json' },
      payload: { status: 'invalido' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });
});
