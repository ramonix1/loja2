import { date, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

import { pedidos } from './pedidos.js';

export const agendamentos = pgTable('agendamentos', {
  id: serial('id').primaryKey(),
  pedidoId: integer('pedido_id')
    .notNull()
    .references(() => pedidos.id, { onDelete: 'cascade' }),
  dataEvento: date('data_evento').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('confirmado'),
  createdAt: timestamp('created_at').defaultNow(),
});
