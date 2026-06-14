import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

/**
 * Configuração padrão da suíte E2E.
 *
 * Fase 2: specs smoke do admin (React) em tests/admin/. Setup de login em
 * fixtures/auth.setup.ts (salva storageState). Vitrine (Next) entra nas
 * Fases 5–6. Nenhum spec aponta para o EJS legacy.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? path.join(os.tmpdir(), 'loja2-e2e-results'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    testIdAttribute: 'data-testid',
  },
  projects: [
    { name: 'setup', testDir: './fixtures', testMatch: /auth\.setup\.ts/ },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['setup'],
      testMatch: /admin\/.*\.spec\.ts/,
    },
    { name: 'buyer-setup', testDir: './fixtures', testMatch: /buyer\.setup\.ts/ },
    {
      name: 'store',
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_STORE_URL ?? 'http://localhost:3000',
        storageState: '.auth/buyer.json',
      },
      dependencies: ['buyer-setup'],
      testMatch: /store\/.*\.spec\.ts/,
    },
  ],
});
