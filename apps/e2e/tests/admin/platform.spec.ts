import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

const MASTER_EMAIL = process.env.E2E_MASTER_EMAIL ?? 'master@suaplataforma.com';
const MASTER_PASSWORD = process.env.E2E_MASTER_PASSWORD ?? 'troque-por-senha-forte-aqui';
const STORE_URL = process.env.E2E_STORE_URL ?? 'http://localhost:3000';

test.use({ storageState: { cookies: [], origins: [] } });

async function platformLogin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/platform/login');
  await page.getByTestId(testIds.platform.loginEmail).fill(MASTER_EMAIL);
  await page.getByTestId(testIds.platform.loginPassword).fill(MASTER_PASSWORD);
  await page.getByTestId(testIds.platform.loginSubmit).click();
  await expect(page.getByTestId(testIds.platform.storesList)).toBeVisible();
}

test('login master acessa Platform Hub @smoke', async ({ page }) => {
  await platformLogin(page);
  await expect(page).toHaveURL(/\/platform\/stores/);
});

test('cria loja e fica acessível na vitrine @smoke', async ({ page }) => {
  const slug = `acme-${Date.now()}`;

  await platformLogin(page);

  await page.getByTestId(testIds.platform.storeCreateLink).click();
  await page.getByTestId(testIds.platform.storeCreateSlug).fill(slug);
  await page.getByTestId(testIds.platform.storeCreateNome).fill('Acme E2E');
  await page.getByTestId(testIds.platform.storeCreateSubmit).click();

  await expect(page.getByTestId(testIds.platform.storeDetail)).toBeVisible();

  await page.goto('/platform/stores');
  await expect(page.getByTestId(testIds.platform.storesRow(slug))).toBeVisible();

  const res = await page.request.get(`${STORE_URL}/store/${slug}`);
  expect(res.ok()).toBeTruthy();
});

test('lojista não acessa Platform Hub', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginSlug).fill(process.env.E2E_STORE_SLUG ?? 'loja');
  await page.getByTestId(testIds.auth.loginEmail).fill(process.env.E2E_ADMIN_EMAIL ?? 'admin@loja.com');
  await page.getByTestId(testIds.auth.loginPassword).fill(process.env.E2E_ADMIN_PASSWORD ?? 'admin123');
  await page.getByTestId(testIds.auth.loginSubmit).click();
  await expect(page.getByTestId(testIds.admin.dashboardStats)).toBeVisible();

  await page.goto('/platform/stores');
  await expect(page).toHaveURL(/\/admin\/dashboard/);
});
