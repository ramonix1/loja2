import { boolean, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

import { produtos } from './produtos.js';

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  subtitulo: varchar('subtitulo', { length: 500 }),
  imagem: varchar('imagem', { length: 500 }).notNull(),
  ctaTexto: varchar('cta_texto', { length: 100 }).default('Ver oferta'),
  ctaUrl: varchar('cta_url', { length: 500 }),
  produtoId: integer('produto_id').references(() => produtos.id, { onDelete: 'set null' }),
  ativo: boolean('ativo').default(true),
  ordem: integer('ordem').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
