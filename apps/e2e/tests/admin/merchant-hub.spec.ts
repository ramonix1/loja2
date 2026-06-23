import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@loja.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin123';
const STORE_SLUG = process.env.E2E_STORE_SLUG ?? 'loja';

test.use({ storageState: { cookies: [], origins: [] } });

test('login mono-loja vai direto ao dashboard @smoke', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginEmail).fill(EMAIL);
  await page.getByTestId(testIds.auth.loginPassword).fill(PASSWORD);
  await page.getByTestId(testIds.auth.loginSubmit).click();

  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByTestId(testIds.admin.dashboardStats)).toBeVisible();
});

test('trocar loja abre hub Minhas lojas @smoke', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginEmail).fill(EMAIL);
  await page.getByTestId(testIds.auth.loginPassword).fill(PASSWORD);
  await page.getByTestId(testIds.auth.loginSubmit).click();
  await expect(page.getByTestId(testIds.admin.dashboardStats)).toBeVisible();

  await page.getByTestId(testIds.merchantHub.switchStore).click();
  await expect(page.getByTestId(testIds.merchantHub.page)).toBeVisible();
  await expect(page.getByTestId(testIds.merchantHub.storeList)).toBeVisible();
  await expect(page.getByTestId(testIds.merchantHub.storeCard(STORE_SLUG))).toBeVisible();

  await page.getByTestId(testIds.merchantHub.selectStore(STORE_SLUG)).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
});
