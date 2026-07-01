import { integer, numeric, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { pedidos } from './pedidos.js';

export const pagamentos = pgTable('pagamentos', {
  id: serial('id').primaryKey(),
  pedidoId: integer('pedido_id')
    .notNull()
    .references(() => pedidos.id, { onDelete: 'cascade' }),
  mpPaymentId: varchar('mp_payment_id', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('pendente'),
  statusMp: varchar('status_mp', { length: 30 }),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
  metodo: varchar('metodo', { length: 20 }),
  respostaJson: text('resposta_json'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
