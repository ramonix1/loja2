import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test('PDP exibe seção de avaliações @smoke', async ({ page }) => {
  await page.goto(storePath('/produto/1'));
  await expect(page.getByTestId(testIds.store.productReviews)).toBeVisible();
});

test('comprador com pedido entregue pode avaliar @smoke', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto(storePath('/login'));
  await page.getByTestId(testIds.auth.loginEmail).fill('comprador-test@loja.com');
  await page.getByTestId(testIds.auth.loginPassword).fill('comprador123');
  await page.getByTestId(testIds.auth.loginSubmit).click();
  await expect(page.getByTestId(testIds.store.header)).toBeVisible();

  await page.goto(storePath('/produto/1'));
  await expect(page.getByTestId(testIds.store.productReviewForm)).toBeVisible({ timeout: 5000 });

  await page.getByTestId(testIds.store.productReviewStar(5)).click();
  await page.locator('#review-comment').fill('Ótimo produto de teste E2E');
  await page.getByTestId(testIds.store.productReviewForm).getByRole('button', { name: /publicar/i }).click();

  await expect(page.getByText('Ótimo produto de teste E2E')).toBeVisible({ timeout: 10000 });
});
