import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin compradores listagem @smoke', async ({ page }) => {
  await page.goto('/admin/compradores');
  await expect(page.getByTestId(testIds.adminCompradores.table)).toBeVisible();
  await expect(page.getByTestId(testIds.adminCompradores.stats)).toBeVisible();
});

test('admin compradores busca por e-mail de teste', async ({ page }) => {
  await page.goto('/admin/compradores');
  await page.getByTestId(testIds.adminCompradores.searchInput).fill('comprador-test@loja.com');
  await page.getByTestId(testIds.adminCompradores.searchBtn).click();
  await expect(page.getByText('Comprador Teste')).toBeVisible();
});
