import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test('checkout metodo teste @smoke', async ({ page }) => {
  await page.goto(storePath('/produto/1'));
  await page.getByTestId(testIds.store.productAddCartBtn).click();
  await expect(page.getByTestId(testIds.store.addCartToast)).toBeVisible();
  await page.getByTestId(testIds.store.headerCart).click();
  await expect(page).toHaveURL(/\/store\/[^/]+\/cart/);
  await expect(page.getByTestId(testIds.store.cartTable)).toBeVisible({ timeout: 15_000 });

  const checkoutBtn = page.getByTestId(testIds.store.cartCheckoutBtn);
  await expect(checkoutBtn).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/store\/[^/]+\/checkout/, { timeout: 15_000 }),
    checkoutBtn.click(),
  ]);

  const cepInput = page.getByText('CEP', { exact: true }).locator('..').locator('input');
  await cepInput.fill('01310100');
  await expect(cepInput).toHaveValue('01310100');
  await page.getByRole('button', { name: 'Buscar' }).first().click();
  await expect(page.getByText(/Frete Grátis|Entrega padrão/)).toBeVisible({ timeout: 15000 });

  const numeroInput = page.getByText('Número', { exact: true }).locator('..').locator('input');
  if ((await numeroInput.inputValue()) === '') {
    await numeroInput.fill('1000');
  }

  await page.getByTestId(testIds.store.checkoutPaymentTeste).check();
  await page.getByTestId(testIds.store.checkoutSubmitBtn).click();

  await expect(page).toHaveURL(/\/store\/[^/]+\/checkout\/resultado\/\d+/, { timeout: 20000 });

  await expect(page.getByTestId(testIds.store.checkoutSuccessMsg)).toBeVisible({ timeout: 20000 });
});
