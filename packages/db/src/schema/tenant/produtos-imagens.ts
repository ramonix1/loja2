import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

import { produtos } from './produtos.js';

export const produtosImagens = pgTable('produtos_imagens', {
  id: serial('id').primaryKey(),
  produtoId: integer('produto_id')
    .references(() => produtos.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
