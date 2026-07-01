import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const platformConfig = pgTable('platform_config', {
  chave: varchar('chave', { length: 100 }).primaryKey(),
  valor: text('valor'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
