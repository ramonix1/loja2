import { defineConfig } from 'drizzle-kit';

/**
 * Projeto Drizzle **separado** para o banco merchant (`atacommerce_<merchant_slug>`),
 * um banco físico por merchant — journal próprio, independente do master/tenant
 * (`drizzle.config.ts`). Necessário porque `schema/merchant` (EN) e `schema/tenant`
 * (PT legado) têm nomes de tabela colidentes (ex.: `banners`) que não podem
 * coexistir num único snapshot Drizzle. Ver docs/specs/db-schema-english.md §5.
 */
export default defineConfig({
  schema: './src/schema/merchant/index.ts',
  out: './drizzle/merchant',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao',
  },
});
