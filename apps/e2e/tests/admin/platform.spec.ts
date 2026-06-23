import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

const MASTER_EMAIL = process.env.E2E_MASTER_EMAIL ?? 'master@suaplataforma.com';
const MASTER_PASSWORD = process.env.E2E_MASTER_PASSWORD ?? 'troque-por-senha-forte-aqui';
const STORE_URL = process.env.E2E_STORE_URL ?? 'http://localhost:3000';

// Specs de plataforma partem deslogadas (ignoram o storageState admin).
test.use({ storageState: { cookies: [], origins: [] } });

async function platformLogin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/platform/login');
  await page.getByTestId(testIds.platform.loginEmail).fill(MASTER_EMAIL);
  await page.getByTestId(testIds.platform.loginPassword).fill(MASTER_PASSWORD);
  await page.getByTestId(testIds.platform.loginSubmit).click();
  await expect(page.getByTestId(testIds.platform.tenantsList)).toBeVisible();
}

test('login master acessa Platform Hub @smoke', async ({ page }) => {
  await platformLogin(page);
  await expect(page).toHaveURL(/\/platform\/tenants/);
});

test('cria tenant e fica acessível na vitrine @smoke', async ({ page }) => {
  const slug = `acme-${Date.now()}`;

  await platformLogin(page);

  await page.getByTestId(testIds.platform.tenantCreateLink).click();
  await page.getByTestId(testIds.platform.tenantCreateSlug).fill(slug);
  await page.getByTestId(testIds.platform.tenantCreateNome).fill('Acme E2E');
  await page.getByTestId(testIds.platform.tenantCreateSubmit).click();

  // Redireciona para o detalhe do tenant recém-criado.
  await expect(page.getByTestId(testIds.platform.tenantDetail)).toBeVisible();

  // A lista exibe o novo tenant.
  await page.goto('/platform/tenants');
  await expect(page.getByTestId(testIds.platform.tenantsRow(slug))).toBeVisible();

  // A vitrine do tenant responde (cross-origin storefront).
  const res = await page.request.get(`${STORE_URL}/store/${slug}`);
  expect(res.ok()).toBeTruthy();
});

test('lojista não acessa Platform Hub', async ({ page }) => {
  // Login lojista padrão (slug loja) e tentativa de abrir /platform/tenants.
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginSlug).fill(process.env.E2E_STORE_SLUG ?? 'loja');
  await page.getByTestId(testIds.auth.loginEmail).fill(process.env.E2E_ADMIN_EMAIL ?? 'admin@loja.com');
  await page.getByTestId(testIds.auth.loginPassword).fill(process.env.E2E_ADMIN_PASSWORD ?? 'admin123');
  await page.getByTestId(testIds.auth.loginSubmit).click();
  await expect(page.getByTestId(testIds.admin.dashboardStats)).toBeVisible();

  // Guard role-based redireciona o lojista de volta ao dashboard.
  await page.goto('/platform/tenants');
  await expect(page).toHaveURL(/\/admin\/dashboard/);
});
