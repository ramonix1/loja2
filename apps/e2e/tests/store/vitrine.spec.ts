import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('home exibe produtos @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId(testIds.store.homeProductGrid)).toBeVisible();
  await expect(page.locator('[data-testid^="store-home-product-card-"]').first()).toBeVisible();
});

test('detalhe produto @smoke', async ({ page }) => {
  await page.goto('/');

  const firstCard = page.locator('[data-testid^="store-home-product-card-"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.getByRole('link', { name: /ver detalhes/i }).click();

  await expect(page.getByTestId(testIds.store.productDetail)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productTitle)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productPrice)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productAddCartBtn)).toBeVisible();
});
