import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { usuarios } from './usuarios.js';

export const tokensRecuperacao = pgTable('tokens_recuperacao', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  canal: varchar('canal', { length: 10 }).default('email'),
  usado: boolean('usado').default(false),
  expiraEm: timestamp('expira_em').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
