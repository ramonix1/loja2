import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

// Reusa o storageState admin (login feito no projeto `setup`).
test('lista pedidos @smoke', async ({ page }) => {
  await page.goto('/admin/pedidos');

  await expect(page.getByTestId(testIds.admin.pedidosTable)).toBeVisible();
});

test('sidebar do admin está visível', async ({ page }) => {
  await page.goto('/admin/pedidos');

  await expect(page.getByTestId(testIds.admin.sidebarNav)).toBeVisible();
});
