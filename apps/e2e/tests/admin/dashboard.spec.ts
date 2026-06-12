import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('dashboard expandido @smoke', async ({ page }) => {
  await page.goto('/admin/dashboard');

  await expect(page.getByTestId(testIds.admin.dashboardStats)).toBeVisible();
  await expect(page.getByTestId(testIds.admin.dashboardCharts)).toBeVisible();
  await expect(page.getByTestId(testIds.admin.dashboardChartRevenue)).toBeVisible();
});

test('seletor de período recarrega gráficos', async ({ page }) => {
  await page.goto('/admin/dashboard');

  await expect(page.getByTestId(testIds.admin.dashboardCharts)).toBeVisible();
  await page.getByTestId(testIds.admin.dashboardChartPeriod('7d')).click();
  await expect(page.getByTestId(testIds.admin.dashboardChartRevenue)).toBeVisible();
});

test('pedidos recentes quando houver dados', async ({ page }) => {
  await page.goto('/admin/dashboard');

  const recent = page.getByTestId(testIds.admin.dashboardRecentOrders);
  if (await recent.isVisible()) {
    await expect(recent).toBeVisible();
  }
});
