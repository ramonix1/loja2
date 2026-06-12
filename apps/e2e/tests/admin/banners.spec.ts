import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin banners listagem @smoke', async ({ page }) => {
  await page.goto('/admin/banners');
  await expect(page.getByTestId(testIds.adminBanners.table)).toBeVisible();
});

test('admin banners formulário novo', async ({ page }) => {
  await page.goto('/admin/banners/novo');
  await expect(page.getByTestId(testIds.adminBanners.tituloInput)).toBeVisible();
  await expect(page.getByTestId(testIds.adminBanners.imagemInput)).toBeAttached();
});
