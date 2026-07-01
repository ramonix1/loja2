import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  timestamp,
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
