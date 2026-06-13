import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('checkout metodo teste @smoke', async ({ page }) => {
  await page.goto('/produto/2');
  await page.getByTestId(testIds.store.productAddCartBtn).click();
  await expect(page).toHaveURL(/\/carrinho/);

  await page.getByTestId(testIds.store.cartCheckoutBtn).click();
  await expect(page).toHaveURL(/\/checkout/);

  const cepInput = page.getByText('CEP', { exact: true }).locator('..').locator('input');
  await cepInput.fill('01310100');
  await page.getByRole('button', { name: 'Buscar' }).first().click();
  await expect(page.getByText('Frete Grátis')).toBeVisible({ timeout: 10000 });

  const numeroInput = page.getByText('Número', { exact: true }).locator('..').locator('input');
  if ((await numeroInput.inputValue()) === '') {
    await numeroInput.fill('1000');
  }

  await page.getByTestId(testIds.store.checkoutPaymentTeste).check();
  await page.getByTestId(testIds.store.checkoutSubmitBtn).click();

  await expect(page).toHaveURL(/\/checkout\/resultado\/\d+/, { timeout: 20000 });

  await expect(page.getByTestId(testIds.store.checkoutSuccessMsg)).toBeVisible({ timeout: 20000 });
});
