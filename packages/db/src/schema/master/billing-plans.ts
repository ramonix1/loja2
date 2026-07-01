import { numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const billingPlans = pgTable('billing_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }),
  billingType: varchar('billing_type', { length: 50 }).notNull(),
  commissionPercentage: numeric('commission_percentage', { precision: 5, scale: 2 }),
  features: text('features').array().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
