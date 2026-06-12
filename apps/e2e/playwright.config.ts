import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração padrão da suíte E2E.
 *
 * Fase 2: specs smoke do admin (React) em tests/admin/. Setup de login em
 * fixtures/auth.setup.ts (salva storageState). Vitrine (Next) entra nas
 * Fases 5–6. Nenhum spec aponta para o EJS legacy.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    testIdAttribute: 'data-testid',
  },
  projects: [
    { name: 'setup', testDir: './fixtures', testMatch: /.*\.setup\.ts/ },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['setup'],
      testMatch: /admin\/.*\.spec\.ts/,
    },
    {
      name: 'store',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.E2E_STORE_URL ?? 'http://localhost:3002',
        storageState: '.auth/buyer.json',
      },
      dependencies: ['setup'],
      testMatch: /store\/.*\.spec\.ts/,
    },
  ],
});
