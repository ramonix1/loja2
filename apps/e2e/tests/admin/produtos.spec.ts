import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin produtos listagem @smoke', async ({ page }) => {
  await page.goto('/admin/produtos');
  await expect(page.getByTestId(testIds.adminProdutos.table)).toBeVisible();
  await expect(page.getByTestId(testIds.adminProdutos.createForm)).toBeVisible();
});

test('admin produtos formulário criar', async ({ page }) => {
  await page.goto('/admin/produtos');
  await expect(page.getByTestId(testIds.adminProdutos.nomeInput)).toBeVisible();
  await expect(page.getByTestId(testIds.adminProdutos.valorInput)).toBeVisible();
  await expect(page.getByTestId(testIds.adminProdutos.imagensInput)).toBeAttached();
});
