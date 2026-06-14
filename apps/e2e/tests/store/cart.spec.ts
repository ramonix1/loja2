import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('add via UI exibe carrinho @smoke', async ({ page }) => {
  await page.goto('/');

  // Card 1 (checkout teste) tem estoque alto; card 2 tem estoque 1 e esgota entre runs.
  const card = page.locator('[data-testid="store-home-product-card-1"]');
  await expect(card).toBeVisible();

  await card.getByRole('button', { name: 'Adicionar' }).click();

  await expect(page).toHaveURL(/\/carrinho/);
  await expect(page.getByTestId(testIds.store.cartTable)).toBeVisible();
});
