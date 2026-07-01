import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const tentativasLogin = pgTable('tentativas_login', {
  id: serial('id').primaryKey(),
  ip: varchar('ip', { length: 45 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  tentativas: integer('tentativas').default(0),
  bloqueadoAte: timestamp('bloqueado_ate'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
