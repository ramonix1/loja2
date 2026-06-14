import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin configuracoes formulario @smoke', async ({ page }) => {
  await page.goto('/admin/configuracoes');
  await expect(page.getByTestId(testIds.adminConfiguracoes.form)).toBeVisible();
  await expect(page.getByTestId(testIds.adminConfiguracoes.controlaEstoqueInput)).toBeVisible();
});

test('admin configuracoes salvar controle de estoque', async ({ page }) => {
  await page.goto('/admin/configuracoes');
  await page.getByTestId(testIds.adminConfiguracoes.controlaEstoqueInput).click();
  await page.getByTestId(testIds.adminConfiguracoes.formSubmit).click();
  await expect(page.getByTestId(testIds.adminConfiguracoes.successMsg)).toBeVisible();
});
