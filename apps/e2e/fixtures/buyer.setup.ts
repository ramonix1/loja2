import { test as setup } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

import { storePath } from '../lib/store-path';

const BUYER_FILE = '.auth/buyer.json';

setup('autentica como comprador @smoke', async ({ browser }) => {
  const STORE_URL = process.env.E2E_STORE_URL ?? 'http://localhost:3000';
  const context = await browser.newContext({ baseURL: STORE_URL });
  const page = await context.newPage();

  await page.goto(storePath('/login'));
  await page.getByTestId(testIds.auth.loginEmail).fill(
    process.env.E2E_BUYER_EMAIL ?? 'comprador-test@loja.com',
  );
  await page.getByTestId(testIds.auth.loginPassword).fill(
    process.env.E2E_BUYER_PASSWORD ?? 'comprador123',
  );
  await page.getByTestId(testIds.auth.loginSubmit).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));

  await context.storageState({ path: BUYER_FILE });
  await context.close();
});
