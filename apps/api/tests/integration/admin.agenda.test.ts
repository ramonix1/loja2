import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('Admin agenda', () => {
  let app: FastifyInstance;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/admin/agenda?mes=2026-06: 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/agenda?mes=2026-06',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.mes).toBe('2026-06');
    expect(body.data.config).toHaveProperty('capacidade_diaria');
    expect(body.data).toHaveProperty('agendadosMap');
  });

  it('PUT /api/v1/admin/agenda/config: 200', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/agenda/config',
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: {
        capacidade_diaria: 2,
        antecedencia_minima_dias: 1,
        antecedencia_maxima_dias: 90,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.config.capacidade_diaria).toBe(2);
  });

  it('PUT /api/v1/admin/agenda/dias: 200', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/agenda/dias',
      headers: { ...TENANT_HEADER, cookie: adminCookie, 'content-type': 'application/json' },
      payload: { data: '2026-06-15', capacidade: 0, motivo: 'Feriado teste' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('DELETE /api/v1/admin/agenda/dias/:data: 200', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/admin/agenda/dias/2026-06-15',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET mes inválido: 400', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/agenda?mes=invalido',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('GET sem sessão: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/agenda',
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET como comprador: 403', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/agenda',
      headers: { ...TENANT_HEADER, cookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
