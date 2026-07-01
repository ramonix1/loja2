import { jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const sessao = pgTable('sessao', {
  sid: varchar('sid').primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire', { precision: 6, mode: 'date' }).notNull(),
});
