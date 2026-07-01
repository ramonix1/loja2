import { integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const auditoria = pgTable('auditoria', {
  id: serial('id').primaryKey(),
  tabela: varchar('tabela', { length: 100 }).notNull(),
  registroId: integer('registro_id'),
  acao: varchar('acao', { length: 10 }).notNull(),
  dadosAntigos: jsonb('dados_antigos'),
  dadosNovos: jsonb('dados_novos'),
  createdAt: timestamp('created_at').defaultNow(),
});
