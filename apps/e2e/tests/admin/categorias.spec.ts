import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin categorias listagem @smoke', async ({ page }) => {
  await page.goto('/admin/categorias');
  await expect(page.getByTestId(testIds.adminCategorias.table)).toBeVisible();
});

test('admin categorias criar registro', async ({ page }) => {
  await page.goto('/admin/categorias');
  const nome = `Cat E2E ${Date.now()}`;
  await page.getByTestId(testIds.adminCategorias.nomeInput).fill(nome);
  await page.getByTestId(testIds.adminCategorias.createBtn).click();
  await expect(page.getByText(nome)).toBeVisible();
});
