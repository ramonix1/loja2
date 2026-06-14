import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('pedido aparece em meus-pedidos @smoke', async ({ page }) => {
  await page.goto('/meus-pedidos');

  await expect(page.getByTestId(testIds.store.ordersTable)).toBeVisible();
  await expect(page.locator('[data-testid^="store-order-row-"]').first()).toBeVisible();
});
