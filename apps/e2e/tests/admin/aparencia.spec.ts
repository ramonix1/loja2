import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin aparencia formulário @smoke', async ({ page }) => {
  await page.goto('/admin/aparencia');
  await expect(page.getByTestId(testIds.adminAparencia.form)).toBeVisible();
  await expect(page.getByTestId(testIds.adminAparencia.nomeInput)).toBeVisible();
  await expect(page.getByTestId(testIds.adminAparencia.preview)).toBeVisible();
});
