import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test('PDP exibe variantes mock e elementos de compra @smoke', async ({ page }) => {
  await page.goto(storePath('/produto/1'));

  await expect(page.getByTestId(testIds.store.productDetail)).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
  await expect(page.getByTestId(testIds.store.productQty)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productBuyNowBtn)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productTrust)).toBeVisible();

  const picker = page.getByTestId(testIds.store.productVariantPicker);
  if (await picker.isVisible()) {
    await expect(picker.getByText('Prévia')).toBeVisible();
  }
});
