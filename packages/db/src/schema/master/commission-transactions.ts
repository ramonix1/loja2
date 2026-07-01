import { integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { invoices } from './invoices.js';
import { tenants } from './tenants.js';

export const commissionTransactions = pgTable('commission_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: integer('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  pedidoId: integer('pedido_id'),
  orderTotal: numeric('order_total', { precision: 10, scale: 2 }).notNull(),
  commissionPercentage: numeric('commission_percentage', { precision: 5, scale: 2 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull(),
  monthYear: varchar('month_year', { length: 7 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});
