import { integer, numeric, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { categorias } from './categorias.js';

export const produtos = pgTable('produtos', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  subtitulo: varchar('subtitulo', { length: 255 }),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull().default('0'),
  descricao: text('descricao'),
  estoque: integer('estoque'),
  categoriaId: integer('categoria_id').references(() => categorias.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
