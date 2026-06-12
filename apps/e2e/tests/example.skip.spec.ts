/**
 * Exemplo de spec — DESATIVADO na Fase 0 (todo o conteúdo está comentado).
 *
 * A suíte E2E só recebe specs reais quando a UI nova existir:
 *   - admin (React + Vite) → Fase 2  (tests/admin/*.spec.ts)
 *   - vitrine (Next.js)    → Fases 5–6 (tests/store/*.spec.ts)
 *
 * Nunca apontar specs para o EJS legacy. Sempre usar as constantes de
 * `@lojao/test-utils/test-ids` em vez de seletores CSS/texto.
 *
 * Modelo (ative na Fase 2 movendo para tests/admin/login.spec.ts):
 *
 * import { test, expect } from '@playwright/test';
 * import { testIds } from '@lojao/test-utils/test-ids';
 *
 * test('admin login exibe dashboard @smoke', async ({ page }) => {
 *   await page.goto('/login');
 *   await page.getByTestId(testIds.auth.loginEmail).fill('admin@loja.com');
 *   await page.getByTestId(testIds.auth.loginPassword).fill('admin123');
 *   await page.getByTestId(testIds.auth.loginSubmit).click();
 *   await expect(page.getByTestId('admin-dashboard-stats')).toBeVisible();
 * });
 */

export {};
