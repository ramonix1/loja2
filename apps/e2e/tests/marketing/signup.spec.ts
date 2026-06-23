import { expect, test } from '@playwright/test';
import { marketing as marketingIds } from '@lojao/test-utils/test-ids/marketing';
import { signup as testIds } from '@lojao/test-utils/test-ids/signup';

test('/pricing card Professional aponta para o checkout @smoke', async ({ page }) => {
  await page.goto('/pricing');

  const card = page.getByTestId(marketingIds.pricingCard('professional'));
  await expect(card).toBeVisible();
  const cta = card.getByRole('link').first();
  await expect(cta).toHaveAttribute('href', '/signup/checkout?plan=professional');
});

test('/signup mostra resumo do plano e CTA continuar @smoke', async ({ page }) => {
  await page.goto('/signup?plan=professional');

  await expect(page.getByTestId(testIds.page)).toBeVisible();
  const cta = page.getByTestId(testIds.continue);
  await expect(cta).toHaveAttribute('href', '/signup/checkout?plan=professional');
});

test('/signup/checkout renderiza step 1 com input de slug @smoke', async ({ page }) => {
  await page.goto('/signup/checkout?plan=professional');

  await expect(page.getByTestId(testIds.checkoutPage)).toBeVisible();
  await expect(page.getByTestId(testIds.checkoutSlugInput)).toBeVisible();
  await expect(page.getByTestId(testIds.checkoutNext)).toBeVisible();
});

test('/signup/success mostra links de painel e loja @smoke', async ({ page }) => {
  await page.goto('/signup/success?slug=demo&plan=professional');

  await expect(page.getByTestId(testIds.successPage)).toBeVisible();

  const adminLink = page.getByTestId(testIds.successAdminLink);
  await expect(adminLink).toHaveAttribute('href', /\/login$/);

  const storeLink = page.getByTestId(testIds.successStoreLink);
  await expect(storeLink).toHaveAttribute('href', '/store/demo');
});
