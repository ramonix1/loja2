import { integer, numeric, pgTable, serial, timestamp, unique } from 'drizzle-orm/pg-core';

import { produtos } from './produtos.js';
import { usuarios } from './usuarios.js';

export const carrinhoItens = pgTable(
  'carrinho_itens',
  {
    id: serial('id').primaryKey(),
    usuarioId: integer('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    produtoId: integer('produto_id')
      .notNull()
      .references(() => produtos.id, { onDelete: 'cascade' }),
    quantidade: integer('quantidade').notNull().default(1),
    precoUnitario: numeric('preco_unitario', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique().on(t.usuarioId, t.produtoId)],
);
