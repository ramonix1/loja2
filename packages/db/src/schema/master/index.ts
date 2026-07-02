import {
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export * from './merchant-account.js';

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
