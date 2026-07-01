import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const configuracoes = pgTable('configuracoes', {
  chave: varchar('chave', { length: 100 }).primaryKey(),
  valor: text('valor'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
