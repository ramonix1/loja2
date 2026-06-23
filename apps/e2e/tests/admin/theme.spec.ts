import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test.use({ storageState: { cookies: [], origins: [] } });

test('login expõe data-admin-ui-theme @smoke', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('data-admin-ui-theme', /^(escuro|claro)$/);
});

test('toggle admin altera data-admin-ui-theme @smoke', async ({ page }) => {
  await page.goto('/login');
  const html = page.locator('html');
  const before = (await html.getAttribute('data-admin-ui-theme')) ?? 'escuro';

  await page.getByTestId(testIds.admin.uiThemeSwitch).click();

  const after = await html.getAttribute('data-admin-ui-theme');
  expect(after).toBeTruthy();
  expect(after).not.toBe(before);
});

test('platform login expõe data-platform-ui-theme @smoke', async ({ page }) => {
  await page.goto('/platform/login');
  await expect(page.locator('html')).toHaveAttribute('data-platform-ui-theme', /^(escuro|claro)$/);
});

test('toggle platform altera data-platform-ui-theme @smoke', async ({ page }) => {
  await page.goto('/platform/login');
  const html = page.locator('html');
  const before = (await html.getAttribute('data-platform-ui-theme')) ?? 'escuro';

  await page.getByTestId(testIds.platform.uiThemeSwitch).click();

  const after = await html.getAttribute('data-platform-ui-theme');
  expect(after).toBeTruthy();
  expect(after).not.toBe(before);
});
