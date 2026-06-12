import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('lista pedidos @smoke', async ({ page }) => {
  await page.goto('/admin/pedidos');

  await expect(page.getByTestId(testIds.admin.pedidosTable)).toBeVisible();
  await expect(page.getByTestId(testIds.admin.pedidosFilterStatus)).toBeVisible();
});

test('sidebar do admin está visível', async ({ page }) => {
  await page.goto('/admin/pedidos');

  await expect(page.getByTestId(testIds.admin.sidebarNav)).toBeVisible();
});

test('filtro de status e link Ver @smoke', async ({ page }) => {
  await page.goto('/admin/pedidos');
  await page.getByTestId(testIds.admin.pedidosFilterStatus).selectOption('pago');

  const firstRow = page.locator('[data-testid^="admin-pedidos-row-"]').first();
  await expect(firstRow).toBeVisible({ timeout: 10_000 });

  const viewBtn = page.locator('[data-testid^="admin-pedidos-view-btn-"]').first();
  await viewBtn.click();

  await expect(page.getByTestId(testIds.adminPedidoDetail.panel)).toBeVisible();
  await expect(page.getByTestId(testIds.adminPedidoDetail.itemsTable)).toBeVisible();
});
