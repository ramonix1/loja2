import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test('wishlist exige login @smoke', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto(storePath());

  const card = page.locator('[data-testid^="store-home-product-card-"]').first();
  await expect(card).toBeVisible();
  const productId = (await card.getAttribute('data-testid'))!.replace('store-home-product-card-', '');

  await page.getByTestId(testIds.store.wishlistBtn(productId)).click();
  await expect(page).toHaveURL(/\/login\?redirect=/);
});

test('wishlist add/remove logado @smoke', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto(storePath('/login'));
  await page.getByTestId(testIds.auth.loginEmail).fill('comprador-test@loja.com');
  await page.getByTestId(testIds.auth.loginPassword).fill('comprador123');
  await page.getByTestId(testIds.auth.loginSubmit).click();
  await expect(page.getByTestId(testIds.store.header)).toBeVisible();

  await page.goto(storePath());
  const card = page.locator('[data-testid^="store-home-product-card-"]').first();
  const productId = (await card.getAttribute('data-testid'))!.replace('store-home-product-card-', '');

  const wishBtn = page.getByTestId(testIds.store.wishlistBtn(productId));
  await expect(wishBtn).toBeEnabled({ timeout: 10_000 });
  await wishBtn.click();
  await expect(page.getByTestId(testIds.store.headerWishlistBadge)).toBeVisible({ timeout: 5000 });

  await page.goto(storePath('/wishlist'));
  await expect(page.getByTestId(testIds.store.wishlistPage)).toBeVisible();
  const favoritosCard = page.getByTestId(testIds.store.homeProductCard(productId));
  await expect(favoritosCard).toBeVisible();

  await favoritosCard.getByTestId(testIds.store.wishlistBtn(productId)).click();
  await expect(page.getByText(/ainda não salvou/i)).toBeVisible({ timeout: 5000 });
});
