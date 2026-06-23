import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test('add via UI exibe carrinho @smoke', async ({ page }) => {
  await page.goto(storePath());

  const card = page.locator('[data-testid="store-home-product-card-1"]');
  await expect(card).toBeVisible();

  await card.getByRole('button', { name: 'Adicionar' }).click();

  await expect(page).toHaveURL(/\/store\/[^/]+\/carrinho/);
  await expect(page.getByTestId(testIds.store.cartTable)).toBeVisible();
});
