import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { produtos } from './produtos.js';

export const movimentacoesEstoque = pgTable('movimentacoes_estoque', {
  id: serial('id').primaryKey(),
  produtoId: integer('produto_id')
    .notNull()
    .references(() => produtos.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 20 }).notNull(),
  quantidade: integer('quantidade').notNull(),
  origem: varchar('origem', { length: 30 }),
  origemId: integer('origem_id'),
  observacao: text('observacao'),
  createdAt: timestamp('created_at').defaultNow(),
});
