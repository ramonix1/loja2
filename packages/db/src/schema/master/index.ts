import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  nome: varchar('nome', { length: 100 }).notNull(),
  dbHost: varchar('db_host', { length: 100 }).notNull().default('localhost'),
  dbPort: integer('db_port').notNull().default(5432),
  dbName: varchar('db_name', { length: 100 }).notNull(),
  dbUser: varchar('db_user', { length: 100 }).notNull(),
  dbPassword: varchar('db_password', { length: 100 }).notNull(),
  plano: varchar('plano', { length: 20 }).default('basic'),
  ativo: boolean('ativo').default(true),
  gatewayType: varchar('gateway_type', { length: 20 }).default('asaas_native'),
  asaasAccountId: varchar('asaas_account_id', { length: 50 }),
  asaasWalletId: varchar('asaas_wallet_id', { length: 50 }),
  feePercentOverride: numeric('fee_percent_override', { precision: 5, scale: 2 }),
  gatewayCredentials: jsonb('gateway_credentials').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessao = pgTable('sessao', {
  sid: varchar('sid').primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire', { precision: 6, mode: 'date' }).notNull(),
});

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

export const platformConfig = pgTable('platform_config', {
  chave: varchar('chave', { length: 100 }).primaryKey(),
  valor: text('valor'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  nomeContato: varchar('nome_contato', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  telefone: varchar('telefone', { length: 20 }),
  nomeEmpresa: varchar('nome_empresa', { length: 150 }),
  cpfCnpj: varchar('cpf_cnpj', { length: 18 }),
  slugDesejado: varchar('slug_desejado', { length: 50 }),
  plano: varchar('plano', { length: 20 }).notNull().default('basic'),
  status: varchar('status', { length: 30 }).notNull().default('novo'),
  consultorNome: varchar('consultor_nome', { length: 100 }),
  asaasCustomerId: varchar('asaas_customer_id', { length: 50 }),
  asaasPaymentId: varchar('asaas_payment_id', { length: 50 }),
  tenantSlug: varchar('tenant_slug', { length: 50 }),
  termosAceitosEm: timestamp('termos_aceitos_em'),
  observacoes: text('observacoes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const webhookEvents = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 20 }).notNull(),
  eventId: varchar('event_id', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});
