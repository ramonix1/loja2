import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin diagnostico painel @smoke', async ({ page }) => {
  await page.goto('/admin/diagnostico');
  await expect(page.getByTestId(testIds.adminDiagnostico.panel)).toBeVisible();
  await expect(page.getByTestId(testIds.adminDiagnostico.results)).toBeVisible();
});

test('admin diagnostico exibe itens de env', async ({ page }) => {
  await page.goto('/admin/diagnostico');
  await expect(page.getByTestId(testIds.adminDiagnostico.item('MP_ACCESS_TOKEN'))).toBeVisible();
});
