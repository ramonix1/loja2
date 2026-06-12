import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin relatorios listagem @smoke', async ({ page }) => {
  await page.goto('/admin/relatorios');
  await expect(page.getByTestId(testIds.adminRelatorios.panel)).toBeVisible();
  await expect(page.getByTestId(testIds.adminRelatorios.tabs)).toBeVisible();
  await expect(page.getByTestId(testIds.adminRelatorios.tab('vendas'))).toBeVisible();
});

test('admin relatorios troca aba estoque', async ({ page }) => {
  await page.goto('/admin/relatorios');
  await page.getByTestId(testIds.adminRelatorios.tab('estoque')).click();
  await expect(page.getByTestId(testIds.adminRelatorios.tab('estoque'))).toHaveClass(/bg-blue-600/);
});
