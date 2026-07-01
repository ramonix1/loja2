import { date, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const agendaDiasEspeciais = pgTable('agenda_dias_especiais', {
  data: date('data').primaryKey(),
  capacidade: integer('capacidade'),
  motivo: varchar('motivo', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});
