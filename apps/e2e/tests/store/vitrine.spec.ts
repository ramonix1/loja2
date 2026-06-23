import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test('home exibe produtos @smoke', async ({ page }) => {
  await page.goto(storePath());

  await expect(page.getByTestId(testIds.store.slugLayout)).toBeVisible();
  await expect(page.locator('[data-store-theme]')).toHaveAttribute('data-store-theme', /^(escuro|claro)$/);
  await expect(page.getByTestId(testIds.store.homeProductGrid)).toBeVisible();
  await expect(page.locator('[data-testid^="store-home-product-card-"]').first()).toBeVisible();
});

test('detalhe produto @smoke', async ({ page }) => {
  await page.goto(storePath());

  const firstCard = page.locator('[data-testid^="store-home-product-card-"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.getByRole('link', { name: /ver detalhes/i }).click();

  await expect(page.getByTestId(testIds.store.productDetail)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productTitle)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productPrice)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productAddCartBtn)).toBeVisible();
});

test('landing raiz não exibe vitrine tenant @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId(testIds.store.slugLayout)).not.toBeVisible();
  await expect(page.getByTestId(testIds.store.header)).not.toBeVisible();
});
