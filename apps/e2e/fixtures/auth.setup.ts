import { test as setup, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

/**
 * Setup de autenticação: faz login admin via UI e salva o storageState
 * (cookie de sessão `lojao.sid`) em `.auth/admin.json`, reutilizado pelas
 * specs do projeto `admin`.
 */
const ADMIN_FILE = '.auth/admin.json';
const STORE_SLUG = process.env.E2E_STORE_SLUG ?? 'loja';

setup('autentica como admin @smoke', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginEmail).fill(process.env.E2E_ADMIN_EMAIL ?? 'admin@loja.com');
  await page
    .getByTestId(testIds.auth.loginPassword)
    .fill(process.env.E2E_ADMIN_PASSWORD ?? 'admin123');
  await page.getByTestId(testIds.auth.loginSubmit).click();

  await Promise.race([
    page.waitForURL(/\/admin\/dashboard/),
    page.waitForURL(/\/admin\/my-stores/),
  ]);

  if (page.url().includes('/my-stores')) {
    await page.getByTestId(testIds.merchantHub.selectStore(STORE_SLUG)).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  }

  await expect(page.getByTestId(testIds.admin.dashboardStats)).toBeVisible();
  await page.context().storageState({ path: ADMIN_FILE });
});
