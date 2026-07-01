import { integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { billingPlans } from './billing-plans.js';
import { tenants } from './tenants.js';

export const tenantBilling = pgTable('tenant_billing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => billingPlans.id),
  billingType: varchar('billing_type', { length: 50 }).notNull(),
  monthlyFee: numeric('monthly_fee', { precision: 10, scale: 2 }),
  commissionPercentage: numeric('commission_percentage', { precision: 5, scale: 2 }),
  trialEndsAt: timestamp('trial_ends_at'),
  nextBillingDate: timestamp('next_billing_date'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
