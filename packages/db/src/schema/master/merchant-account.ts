import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * MA1 — schema greenfield da initiative merchant-account (master DB).
 */

export const merchants = pgTable('merchants', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  active: boolean('active').default(true),
  dbName: varchar('db_name', { length: 100 }).notNull(),
  dbHost: varchar('db_host', { length: 100 }).notNull(),
  dbPort: integer('db_port').notNull().default(5432),
  dbUser: varchar('db_user', { length: 100 }).notNull(),
  dbPassword: varchar('db_password', { length: 100 }).notNull(),
  /**
   * MA6 — limite de lojas do plano contratado (`Starter`=1, `Professional`=3,
   * `Enterprise`=sob contrato). Enforcement em `createStoreForMerchant`.
   * Guardado direto no merchant (não em `billing_plans`/`merchant_billing`,
   * ainda não criadas — deferidas para MA7) por decisão conservadora; ver
   * assunções MA6 em `merchant-account-STATUS.md`.
   */
  maxStores: integer('max_stores').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const stores = pgTable(
  'stores',
  {
    id: serial('id').primaryKey(),
    merchantId: integer('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('idx_stores_merchant_id').on(t.merchantId)],
);

export const merchantMembers = pgTable(
  'merchant_members',
  {
    id: serial('id').primaryKey(),
    merchantId: integer('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    /** 'owner' | 'admin' | 'operator' | 'platform_admin' — role global na conta (MA1); escopo por loja fica para revisão futura (spec §11.3). */
    role: varchar('role', { length: 20 }).notNull().default('owner'),
    active: boolean('active').default(true),
    /** MA5 — bloqueio por conta (paridade com `usuarios.tentativas_falha`/`bloqueado_ate` do modelo tenant). */
    failedAttempts: integer('failed_attempts').notNull().default(0),
    blockedUntil: timestamp('blocked_until'),
    lastAccessAt: timestamp('last_access_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    unique('uq_merchant_members_merchant_email').on(t.merchantId, t.email),
    index('idx_merchant_members_merchant_id').on(t.merchantId),
  ],
);

/**
 * MA5 — bloqueio por IP no login de conta merchant (master, `SELECT` único).
 * Espelha `tentativas_login` (tenant), mas em escopo global no master —
 * ver docs/specs/db-schema-english.md §4 ("login_attempts — master recomendado").
 */
export const loginAttempts = pgTable('login_attempts', {
  id: serial('id').primaryKey(),
  ip: varchar('ip', { length: 45 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  attempts: integer('attempts').default(0),
  blockedUntil: timestamp('blocked_until'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * MA7 — billing por conta merchant (substitui `tenant_billing` no cutover MA8).
 * FK `plan_id` → `billing_plans` (tabela compartilhada, já EN) — enforced na
 * migration SQL; sem `.references()` aqui para evitar import circular com
 * `schema/master/index.ts`.
 */
export const merchantBilling = pgTable(
  'merchant_billing',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchantId: integer('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id').notNull(),
    billingType: varchar('billing_type', { length: 50 }).notNull(),
    monthlyFee: numeric('monthly_fee', { precision: 10, scale: 2 }),
    commissionPercentage: numeric('commission_percentage', { precision: 5, scale: 2 }),
    trialEndsAt: timestamp('trial_ends_at'),
    nextBillingDate: timestamp('next_billing_date'),
    status: varchar('status', { length: 50 }).default('active'),
    /**
     * MA7 — limite customizado de lojas para plano Enterprise (contrato).
     * Quando preenchido, sobrescreve `merchants.max_stores` via serviço de billing.
     */
    customMaxStores: integer('custom_max_stores'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    unique('uq_merchant_billing_merchant_id').on(t.merchantId),
    index('idx_merchant_billing_merchant_id').on(t.merchantId),
  ],
);

/**
 * MA7 — faturas mensais por conta merchant (paralelo a `invoices.tenant_id`
 * até o cutover MA8).
 */
export const merchantInvoices = pgTable(
  'merchant_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchantId: integer('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),
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
  },
  (t) => [
    index('idx_merchant_invoices_merchant_id').on(t.merchantId),
    index('idx_merchant_invoices_month_year').on(t.monthYear),
  ],
);

/**
 * MA7 — comissões por pedido, agregadas por conta merchant (`order_id` no
 * merchant DB; sem FK física cross-banco).
 */
export const merchantCommissionTransactions = pgTable(
  'merchant_commission_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchantId: integer('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').references(() => merchantInvoices.id),
    orderId: integer('order_id'),
    orderTotal: numeric('order_total', { precision: 10, scale: 2 }).notNull(),
    commissionPercentage: numeric('commission_percentage', { precision: 5, scale: 2 }).notNull(),
    commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull(),
    monthYear: varchar('month_year', { length: 7 }).notNull(),
    status: varchar('status', { length: 50 }).default('pending'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('idx_merchant_commission_merchant_id').on(t.merchantId),
    index('idx_merchant_commission_month_year').on(t.monthYear),
  ],
);
