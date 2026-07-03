import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test('add via UI exibe carrinho @smoke', async ({ page }) => {
  await page.goto(storePath());

  const card = page.locator('[data-testid="store-home-product-card-1"]');
  await expect(card).toBeVisible();

  await card.getByRole('button', { name: /adicionar ao carrinho/i }).click();
  await expect(page.getByTestId(testIds.store.addCartToast)).toBeVisible();

  await page.getByTestId(testIds.store.headerCart).click();
  await expect(page).toHaveURL(/\/store\/[^/]+\/cart/);
  await expect(page.getByTestId(testIds.store.cartTable)).toBeVisible();
});
