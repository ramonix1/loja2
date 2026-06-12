import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('GET/PUT /api/v1/admin/aparencia', () => {
  let app: FastifyInstance;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET como admin: 200 com campos loja_*', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/aparencia',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data).toHaveProperty('loja_nome');
    expect(data).toHaveProperty('loja_cor_primaria');
    expect(data).toHaveProperty('loja_logo');
  });

  it('PUT atualizar campos texto: 200', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/aparencia',
      headers: {
        ...TENANT_HEADER,
        cookie: adminCookie,
        'content-type': 'multipart/form-data; boundary=----ap',
      },
      payload:
        `------ap\r\nContent-Disposition: form-data; name="loja_nome"\r\n\r\nLoja Vitest\r\n` +
        `------ap\r\nContent-Disposition: form-data; name="loja_slogan"\r\n\r\nSlogan teste\r\n` +
        `------ap\r\nContent-Disposition: form-data; name="loja_cor_primaria"\r\n\r\n#ff5500\r\n` +
        `------ap\r\nContent-Disposition: form-data; name="loja_rodape"\r\n\r\nRodapé teste\r\n` +
        `------ap\r\nContent-Disposition: form-data; name="loja_email"\r\n\r\ncontato@teste.com\r\n` +
        `------ap\r\nContent-Disposition: form-data; name="loja_whatsapp"\r\n\r\n(11) 99999-0000\r\n` +
        `------ap--\r\n`,
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.loja_nome).toBe('Loja Vitest');
    expect(data.loja_cor_primaria).toBe('#ff5500');
    expect(data.loja_email).toBe('contato@teste.com');
  });

  it('PUT e-mail inválido: 400', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/aparencia',
      headers: {
        ...TENANT_HEADER,
        cookie: adminCookie,
        'content-type': 'multipart/form-data; boundary=----bad',
      },
      payload:
        '------bad\r\nContent-Disposition: form-data; name="loja_email"\r\n\r\nnao-email\r\n------bad--\r\n',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('GET sem sessão: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/aparencia',
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET como comprador: 403', async () => {
    const userCookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/aparencia',
      headers: { ...TENANT_HEADER, cookie: userCookie },
    });
    expect(res.statusCode).toBe(403);
  });
});
