import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('add via UI exibe carrinho @smoke', async ({ page }) => {
  await page.goto('/');

  const card = page.locator('[data-testid="store-home-product-card-2"]');
  await expect(card).toBeVisible();

  await card.getByRole('button', { name: 'Adicionar' }).click();

  await expect(page).toHaveURL(/\/carrinho/);
  await expect(page.getByTestId(testIds.store.cartTable)).toBeVisible();
});
