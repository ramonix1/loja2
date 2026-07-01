import { integer, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { tenants } from './tenants.js';

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  monthYear: varchar('month_year', { length: 7 }).notNull(),
  billingType: varchar('billing_type', { length: 50 }).notNull(),
  monthlyFee: numeric('monthly_fee', { precision: 10, scale: 2 }),
  totalSales: numeric('total_sales', { precision: 15, scale: 2 }),
  commissionPercentage: numeric('commission_percentage', { precision: 5, scale: 2 }),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }),
  taxes: numeric('taxes', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 50 }).default('pending'),
  issueDate: timestamp('issue_date').defaultNow(),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
