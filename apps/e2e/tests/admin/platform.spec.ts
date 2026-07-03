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
  await expect(page.getByTestId(testIds.platform.dashboardPage)).toBeVisible();
}

test('login master acessa Platform Hub @smoke', async ({ page }) => {
  await platformLogin(page);
  await expect(page).toHaveURL(/\/platform\/dashboard/);
  await expect(page.getByTestId(testIds.platform.kpiStrip)).toBeVisible();
  await expect(page.getByTestId(testIds.platform.dashboardCharts)).toBeVisible();
});

test('cria loja e fica acessível na vitrine @smoke', async ({ page }) => {
  const slug = `acme-${Date.now()}`;

  await platformLogin(page);

  await page.goto('/platform/stores');
  await page.getByTestId(testIds.platform.storeCreateLink).first().click();
  await page.getByTestId(testIds.platform.storeCreateSlug).fill(slug);
  await page.getByTestId(testIds.platform.storeCreateNome).fill('Acme E2E');
  await page.getByTestId(testIds.platform.storeCreateSubmit).click();

  await expect(page.getByTestId(testIds.platform.storeDetail)).toBeVisible();

  await page.goto('/platform/stores');
  await expect(page.getByTestId(testIds.platform.storeCard(slug))).toBeVisible();

  const res = await page.request.get(`${STORE_URL}/store/${slug}`);
  expect(res.ok()).toBeTruthy();
});

test('⌘K abre a paleta de comandos e navega para Merchants @smoke', async ({ page }) => {
  await platformLogin(page);

  await page.keyboard.press('Control+k');
  await expect(page.getByTestId(testIds.platform.commandPalette)).toBeVisible();

  await page.getByTestId(testIds.platform.commandPaletteInput).fill('merchants');
  await page.getByTestId(testIds.platform.commandPaletteItem('/platform/merchants')).click();

  await expect(page).toHaveURL(/\/platform\/merchants/);
  await expect(page.getByTestId(testIds.platform.commandPalette)).toBeHidden();
});

test('lista de merchants exibe a conta recém-criada @smoke', async ({ page }) => {
  const slug = `acme-merchant-${Date.now()}`;

  await platformLogin(page);

  await page.goto('/platform/stores');
  await page.getByTestId(testIds.platform.storeCreateLink).first().click();
  await page.getByTestId(testIds.platform.storeCreateSlug).fill(slug);
  await page.getByTestId(testIds.platform.storeCreateNome).fill('Acme Merchant E2E');
  await page.getByTestId(testIds.platform.storeCreateSubmit).click();
  await expect(page.getByTestId(testIds.platform.storeDetail)).toBeVisible();

  await page.goto('/platform/merchants');
  await expect(page.getByTestId(testIds.platform.merchantsPage)).toBeVisible();

  await page.getByTestId(testIds.platform.merchantsSearch).fill(slug);
  await expect(page.getByTestId(testIds.platform.merchantsRow(slug))).toBeVisible();
});

test('filtros de status e plano atualizam a query da listagem de lojas', async ({ page }) => {
  await platformLogin(page);
  await page.goto('/platform/stores');

  await page.getByTestId(testIds.platform.storesFilterStatus).selectOption('active');
  await expect(page).toHaveURL(/status=active/);

  await page.getByTestId(testIds.platform.storesFilterPlano).selectOption('starter');
  await expect(page).toHaveURL(/plano=starter/);
});

test('lojista não acessa Platform Hub', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(testIds.auth.loginEmail).fill(process.env.E2E_ADMIN_EMAIL ?? 'admin@loja.com');
  await page.getByTestId(testIds.auth.loginPassword).fill(process.env.E2E_ADMIN_PASSWORD ?? 'admin123');
  await page.getByTestId(testIds.auth.loginSubmit).click();
  await expect(page.getByTestId(testIds.admin.dashboardStats)).toBeVisible();

  await page.goto('/platform/stores');
  await expect(page).toHaveURL(/\/admin\/dashboard/);
});

test('detalhe da loja exibe tabs e billing @smoke', async ({ page }) => {
  await platformLogin(page);
  await page.goto('/platform/stores');

  const firstCard = page.getByTestId(/^platform-store-card-/).first();
  await firstCard.getByRole('link', { name: 'Editar loja' }).click();
  await expect(page.getByTestId(testIds.platform.storeDetail)).toBeVisible();
  await expect(page.getByTestId(testIds.platform.storeTabOverview)).toBeVisible();

  await page.getByTestId(testIds.platform.storeTabBilling).click();
  await expect(page.getByTestId(`${testIds.platform.storeTabBilling}-panel`)).toBeVisible();

  await page.getByTestId(testIds.platform.storeTabMerchant).click();
  await expect(page.getByTestId(testIds.platform.storeTabMerchant)).toBeVisible();
});

test('páginas health e reports carregam @smoke', async ({ page }) => {
  await platformLogin(page);

  await page.goto('/platform/health');
  await expect(page.getByTestId(testIds.platform.healthPage)).toBeVisible();
  await expect(page.getByTestId(testIds.platform.healthKpiStrip)).toBeVisible();

  await page.goto('/platform/reports');
  await expect(page.getByTestId(testIds.platform.reportsPage)).toBeVisible();
  await expect(page.getByTestId(testIds.platform.reportsKpiStrip)).toBeVisible();
});

test('sidebar NavUser abre com toggle de tema @smoke', async ({ page }) => {
  await platformLogin(page);
  await expect(page.getByTestId(testIds.platform.sidebarNav)).toBeVisible();
  await page.getByTestId('user-menu-trigger').click();
  await expect(page.getByTestId(testIds.platform.uiThemeSwitch)).toBeVisible();
});

test('sidebar collapse no desktop @smoke', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await platformLogin(page);
  await page.getByTestId(testIds.platform.sidebarTrigger).click();
  await expect(page.locator('[data-slot="sidebar"]').first()).toHaveAttribute('data-state', 'collapsed');
});

test('logout via NavUser @smoke', async ({ page }) => {
  await platformLogin(page);
  await page.getByTestId('user-menu-trigger').click();
  await page.getByTestId('user-menu-logout').click();
  await expect(page).toHaveURL(/\/login/);
});
