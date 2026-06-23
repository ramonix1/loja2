import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@loja.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin123';
const STORE_SLUG = process.env.E2E_STORE_SLUG ?? 'loja';

test.use({ storageState: { cookies: [], origins: [] } });

test('admin login sem slug exibe dashboard @smoke', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByTestId(testIds.auth.loginBrand)).toBeVisible();
  await page.getByTestId(testIds.auth.loginEmail).fill(EMAIL);
  await page.getByTestId(testIds.auth.loginPassword).fill(PASSWORD);
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
});

test('admin login com credencial inválida exibe erro', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginEmail).fill(EMAIL);
  await page.getByTestId(testIds.auth.loginPassword).fill('senha-errada');
  await page.getByTestId(testIds.auth.loginSubmit).click();

  await expect(page.getByTestId(testIds.auth.loginError)).toBeVisible();
});
