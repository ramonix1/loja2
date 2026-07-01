import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const webhookEvents = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 20 }).notNull(),
  eventId: varchar('event_id', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});
