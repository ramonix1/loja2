import { integer, numeric, pgTable, serial, varchar } from 'drizzle-orm/pg-core';

import { pedidos } from './pedidos.js';
import { produtos } from './produtos.js';

export const pedidoItens = pgTable('pedido_itens', {
  id: serial('id').primaryKey(),
  pedidoId: integer('pedido_id')
    .notNull()
    .references(() => pedidos.id, { onDelete: 'cascade' }),
  produtoId: integer('produto_id').references(() => produtos.id, { onDelete: 'set null' }),
  nomeProduto: varchar('nome_produto', { length: 255 }).notNull(),
  quantidade: integer('quantidade').notNull(),
  precoUnitario: numeric('preco_unitario', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
});
