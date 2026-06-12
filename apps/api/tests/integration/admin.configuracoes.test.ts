import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { loginAdminCookie, loginUserCookie, TENANT_HEADER } from '../helpers/session.js';

describe('GET/PUT /api/v1/admin/configuracoes', () => {
  let app: FastifyInstance;
  let adminCookie: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminCookie = await loginAdminCookie(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET como admin: 200 com campos operacionais', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/configuracoes',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data).toMatchObject({
      controla_estoque: expect.any(Boolean),
      frete_fixo: expect.any(Number),
      melhor_envio_sandbox: expect.any(Boolean),
    });
  });

  it('PUT atualizar estoque e frete: 200', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/configuracoes',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
      payload: {
        controla_estoque: true,
        reservar_estoque_carrinho: true,
        modulo_agenda: false,
        habilitar_sumup: false,
        frete_cep_origem: '01310100',
        frete_fixo: 15.5,
        frete_gratis_acima: 200,
        melhor_envio_token: 'token-teste',
        melhor_envio_sandbox: true,
        frete_peso_padrao: 400,
        frete_altura: 5,
        frete_largura: 15,
        frete_comprimento: 20,
      },
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.controla_estoque).toBe(true);
    expect(data.reservar_estoque_carrinho).toBe(true);
    expect(data.frete_cep_origem).toBe('01310-100');
    expect(data.frete_fixo).toBe(15.5);
    expect(data.melhor_envio_token).toBe('token-teste');
  });

  it('PUT frete negativo: 400', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/configuracoes',
      headers: { ...TENANT_HEADER, cookie: adminCookie },
      payload: {
        controla_estoque: false,
        reservar_estoque_carrinho: false,
        modulo_agenda: false,
        habilitar_sumup: false,
        frete_cep_origem: '',
        frete_fixo: -1,
        frete_gratis_acima: 0,
        melhor_envio_token: '',
        melhor_envio_sandbox: true,
        frete_peso_padrao: 300,
        frete_altura: 4,
        frete_largura: 12,
        frete_comprimento: 17,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('VALIDATION_ERROR');
  });

  it('GET sem sessão: 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/configuracoes',
      headers: TENANT_HEADER,
    });
    expect(res.statusCode).toBe(401);
  });

  it('PUT como comprador: 403', async () => {
    const cookie = await loginUserCookie(app);
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/configuracoes',
      headers: { ...TENANT_HEADER, cookie },
      payload: {
        controla_estoque: true,
        reservar_estoque_carrinho: false,
        modulo_agenda: false,
        habilitar_sumup: false,
        frete_cep_origem: '',
        frete_fixo: 0,
        frete_gratis_acima: 0,
        melhor_envio_token: '',
        melhor_envio_sandbox: true,
        frete_peso_padrao: 300,
        frete_altura: 4,
        frete_largura: 12,
        frete_comprimento: 17,
      },
    });
    expect(res.statusCode).toBe(403);
  });
});
