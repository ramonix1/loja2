import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test('home exibe produtos @smoke', async ({ page }) => {
  await page.goto(storePath());

  await expect(page.getByTestId(testIds.store.slugLayout)).toBeVisible();
  // Vitrine fixa em tema claro (sem toggle do visitante).
  await expect(page.locator('[data-store-theme]')).toHaveAttribute('data-store-theme', 'claro');
  await expect(page.getByTestId(testIds.store.homeProductGrid)).toBeVisible();
  await expect(page.locator('[data-testid^="store-home-product-card-"]').first()).toBeVisible();
});

test('detalhe produto @smoke', async ({ page }) => {
  await page.goto(storePath());

  const firstCard = page.locator('[data-testid^="store-home-product-card-"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.getByRole('heading', { level: 2 }).click();

  await expect(page.getByTestId(testIds.store.productDetail)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productTitle)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productPrice)).toBeVisible();
  await expect(page.getByTestId(testIds.store.productAddCartBtn)).toBeVisible();
});

test('PDP exibe seletor de quantidade @smoke', async ({ page }) => {
  await page.goto(storePath('/produto/1'));
  await expect(page.getByTestId(testIds.store.productQtyInput)).toBeVisible();
});

test('landing raiz não exibe vitrine tenant @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId(testIds.store.slugLayout)).not.toBeVisible();
  await expect(page.getByTestId(testIds.store.header)).not.toBeVisible();
});

test('filtros e busca client-side na home @smoke', async ({ page }) => {
  await page.goto(storePath());

  await expect(page.getByTestId(testIds.store.homeFiltersBar)).toBeVisible();
  await expect(page.getByTestId(testIds.store.filtersSort)).toBeVisible();

  await page.getByTestId(testIds.store.headerSearch).fill('___produto-inexistente___');
  await expect(page.getByText(/nenhum produto encontrado/i)).toBeVisible({ timeout: 5000 });
});
