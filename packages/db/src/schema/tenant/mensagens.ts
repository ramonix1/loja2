import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { conversas } from './conversas.js';

export const mensagens = pgTable('mensagens', {
  id: serial('id').primaryKey(),
  conversaId: integer('conversa_id')
    .notNull()
    .references(() => conversas.id, { onDelete: 'cascade' }),
  remetente: varchar('remetente', { length: 10 }).notNull(),
  conteudo: text('conteudo').notNull(),
  lida: boolean('lida').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
