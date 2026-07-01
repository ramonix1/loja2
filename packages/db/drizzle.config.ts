import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: [
    './src/schema/master/!(index).ts',
    './src/schema/tenant/!(index).ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lojao',
  },
});
