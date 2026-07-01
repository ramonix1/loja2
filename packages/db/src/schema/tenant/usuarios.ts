import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('usuario'),
  telefone: varchar('telefone', { length: 20 }),
  cpf: varchar('cpf', { length: 14 }),
  cep: varchar('cep', { length: 9 }),
  logradouro: varchar('logradouro', { length: 255 }),
  numero: varchar('numero', { length: 20 }),
  complemento: varchar('complemento', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }),
  cidade: varchar('cidade', { length: 100 }),
  estado: varchar('estado', { length: 2 }),
  ativo: boolean('ativo').default(true),
  tentativasFalha: integer('tentativas_falha').default(0),
  bloqueadoAte: timestamp('bloqueado_ate'),
  ultimoAcesso: timestamp('ultimo_acesso'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
