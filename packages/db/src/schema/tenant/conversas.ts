import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { usuarios } from './usuarios.js';

export const conversas = pgTable('conversas', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  nomeVisitante: varchar('nome_visitante', { length: 100 }).default('Visitante'),
  status: varchar('status', { length: 20 }).notNull().default('aberta'),
  botAtivo: boolean('bot_ativo').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
