import { date, integer, numeric, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

import { usuarios } from './usuarios.js';

export const pedidos = pgTable('pedidos', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  nomeEntrega: varchar('nome_entrega', { length: 255 }).notNull(),
  emailEntrega: varchar('email_entrega', { length: 255 }).notNull(),
  telefoneEntrega: varchar('telefone_entrega', { length: 20 }),
  cpfEntrega: varchar('cpf_entrega', { length: 14 }),
  cep: varchar('cep', { length: 9 }),
  logradouro: varchar('logradouro', { length: 255 }),
  numero: varchar('numero', { length: 20 }),
  complemento: varchar('complemento', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }),
  cidade: varchar('cidade', { length: 100 }),
  estado: varchar('estado', { length: 2 }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  frete: numeric('frete', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('aguardando_pagamento'),
  metodoPagamento: varchar('metodo_pagamento', { length: 20 }),
  mpPaymentId: varchar('mp_payment_id', { length: 100 }),
  dataEvento: date('data_evento'),
  codigoRastreio: varchar('codigo_rastreio', { length: 100 }),
  freteServico: varchar('frete_servico', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
