import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../../lib/store-path';

test.describe('ícones vitrine (I5) @smoke', () => {
  test('mobile exibe menu hamburger', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(storePath());

    await expect(page.getByTestId(testIds.store.header)).toBeVisible();
    await expect(page.getByTestId(testIds.store.headerMenu)).toBeVisible();
    await expect(page.getByTestId(testIds.store.headerMenu)).toHaveAttribute(
      'aria-label',
      /menu/i,
    );
  });

  test('comprador autenticado vê ícone carrinho no header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(storePath());

    await expect(page.getByTestId(testIds.store.headerCart)).toBeVisible();
    await expect(page.getByTestId(testIds.store.headerCart)).toHaveAttribute(
      'aria-label',
      /carrinho/i,
    );
  });
});
