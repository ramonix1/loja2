import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@loja.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin123';

// Specs de login partem deslogadas (ignoram o storageState do projeto admin).
test.use({ storageState: { cookies: [], origins: [] } });

test('admin login exibe dashboard @smoke', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginEmail).fill(EMAIL);
  await page.getByTestId(testIds.auth.loginPassword).fill(PASSWORD);
  await page.getByTestId(testIds.auth.loginSubmit).click();

  await expect(page.getByTestId(testIds.admin.dashboardStats)).toBeVisible();
});

test('admin login com credencial inválida exibe erro', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginEmail).fill(EMAIL);
  await page.getByTestId(testIds.auth.loginPassword).fill('senha-errada');
  await page.getByTestId(testIds.auth.loginSubmit).click();

  await expect(page.getByTestId(testIds.auth.loginError)).toBeVisible();
});
