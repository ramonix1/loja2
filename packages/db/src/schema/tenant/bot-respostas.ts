import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const botRespostas = pgTable('bot_respostas', {
  id: serial('id').primaryKey(),
  palavraChave: varchar('palavra_chave', { length: 200 }).notNull(),
  resposta: text('resposta').notNull(),
  ordem: integer('ordem').default(0),
  ativo: boolean('ativo').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
