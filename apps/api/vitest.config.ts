import { defineConfig } from 'vitest/config';

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/lojao';

// Garante envs antes do globalSetup (processo principal) carregar o seed/pg.
process.env.NODE_ENV ??= 'test';
process.env.PGSSL ??= 'disable';
process.env.DATABASE_URL ??= DEFAULT_DATABASE_URL;
process.env.SESSION_SECRET ??= 'dev-session-secret-troque-em-producao';

export default defineConfig({
  test: {
    globalSetup: './tests/helpers/global-setup.ts',
    include: ['tests/integration/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    // Sessão/rate-limit compartilham o banco: evita corridas entre arquivos.
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      PGSSL: 'disable',
      DATABASE_URL: process.env.DATABASE_URL,
      SESSION_SECRET: process.env.SESSION_SECRET,
    },
  },
});
