import { integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const agendaConfig = pgTable('agenda_config', {
  id: integer('id').primaryKey().default(1),
  capacidadeDiaria: integer('capacidade_diaria').notNull().default(1),
  antecedenciaMinimaDias: integer('antecedencia_minima_dias').notNull().default(1),
  antecedenciaMaximaDias: integer('antecedencia_maxima_dias').notNull().default(180),
  updatedAt: timestamp('updated_at').defaultNow(),
});
