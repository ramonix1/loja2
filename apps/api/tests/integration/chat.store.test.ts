import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-app.js';
import { merchantDbName, merchantPoolConfig } from '../../src/lib/merchant-provision.js';
import { loginUserCookie, TENANT_HEADER } from '../helpers/session.js';
import { TEST_PRIMARY_MERCHANT_SLUG } from '../helpers/seed.js';

describe('Store chat', () => {
  let app: FastifyInstance;
  let userCookie: string;
  let pool: pg.Pool;

  beforeAll(async () => {
    app = await buildTestApp();
    userCookie = await loginUserCookie(app);
    pool = new pg.Pool(merchantPoolConfig(merchantDbName(TEST_PRIMARY_MERCHANT_SLUG)));
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('POST mensagem + bot keyword: resposta bot inserida', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/chat/mensagens',
      headers: { ...TENANT_HEADER, cookie: userCookie, 'content-type': 'application/json' },
      payload: { conteudo: 'Olá, preciso de ajuda' },
    });
    expect(res.statusCode).toBe(201);

    const data = res.json().data;
    expect(data.conversa_id).toBeGreaterThan(0);
    expect(data.bot_mensagem).toBeDefined();
    expect(data.bot_mensagem.remetente).toBe('bot');

    const msgs = await pool.query(
      'SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY id',
      [data.conversa_id],
    );
    expect(msgs.rows.length).toBeGreaterThanOrEqual(2);
    expect(msgs.rows.some((m) => m.sender === 'bot')).toBe(true);
  });
});
