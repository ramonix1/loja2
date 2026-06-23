import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test('login comprador @smoke', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto(storePath('/login'));

  await page.getByTestId(testIds.auth.loginEmail).fill('comprador-test@loja.com');
  await page.getByTestId(testIds.auth.loginPassword).fill('comprador123');
  await page.getByTestId(testIds.auth.loginSubmit).click();

  await expect(page.getByTestId(testIds.store.header)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Carrinho' })).toBeVisible();
});

test('logout comprador', async ({ page }) => {
  await page.goto(storePath());
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();

  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST',
    ),
    page.waitForURL(new RegExp(`/store/[^/]+/?$`), { waitUntil: 'load' }),
    page.getByRole('button', { name: 'Sair' }).click(),
  ]);

  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible({ timeout: 15000 });
});
