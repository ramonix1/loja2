import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin permissoes listagem @smoke', async ({ page }) => {
  await page.goto('/admin/permissoes');
  await expect(page.getByTestId(testIds.adminPermissoes.panel)).toBeVisible();
  await expect(page.getByTestId(testIds.adminPermissoes.createForm)).toBeVisible();
  await expect(page.getByTestId(testIds.adminPermissoes.table)).toBeVisible();
});

test('admin permissoes form criar visivel', async ({ page }) => {
  await page.goto('/admin/permissoes');
  await expect(page.getByTestId(testIds.adminPermissoes.nomeInput)).toBeVisible();
  await expect(page.getByTestId(testIds.adminPermissoes.createBtn)).toBeVisible();
});
