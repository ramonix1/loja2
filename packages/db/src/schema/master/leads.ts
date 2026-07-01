import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

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
