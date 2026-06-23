import { expect, test } from '@playwright/test';
import { marketing as testIds } from '@lojao/test-utils/test-ids/marketing';
import { store as storeTestIds } from '@lojao/test-utils/test-ids/store';
import { storePath } from '../../lib/store-path';

test('landing / exibe hero Ata Labs @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId(testIds.landingHero)).toBeVisible();
  const cta = page.getByTestId(testIds.landingHeroCtaPricing);
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute('href', '/pricing');
});

test('landing / exibe stats @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId(testIds.landingStats)).toBeVisible();
});

test('landing / header e footer marketing presentes, sem header tenant @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId(testIds.header)).toBeVisible();
  await expect(page.getByTestId(testIds.footer)).toBeVisible();
  await expect(page.getByTestId(storeTestIds.slugLayout)).not.toBeVisible();
});

test('landing / formulário de contato visível @smoke', async ({ page }) => {
  await page.goto('/');
  const form = page.getByTestId(testIds.landingContactForm);
  await expect(form).toBeVisible();
});

test('landing / nav leva a /pricing @smoke', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByTestId(testIds.headerNav);
  await expect(nav).toBeVisible();
  const pricingLink = nav.getByRole('link', { name: /planos/i });
  await expect(pricingLink).toHaveAttribute('href', '/pricing');
});

test('/ata-commerce exibe hero produto @smoke', async ({ page }) => {
  await page.goto('/ata-commerce');

  await expect(page.getByTestId(testIds.ataCommerceHero)).toBeVisible();
  await expect(page.getByTestId(testIds.ataCommerceFeatures)).toBeVisible();
  await expect(page.getByTestId(testIds.ataCommerceFaq)).toBeVisible();
});

test('CTA landing leva a /pricing @smoke', async ({ page }) => {
  await page.goto('/');
  const cta = page.getByTestId(testIds.landingHeroCtaPricing);
  await expect(cta).toHaveAttribute('href', '/pricing');
});

test('/pricing exibe 3 cards de preço @smoke', async ({ page }) => {
  await page.goto('/pricing');

  await expect(page.getByTestId(testIds.pricingPage)).toBeVisible();
  await expect(page.getByTestId(testIds.pricingGrid)).toBeVisible();
  await expect(page.getByTestId(testIds.pricingCard('starter'))).toBeVisible();
  await expect(page.getByTestId(testIds.pricingCard('professional'))).toBeVisible();
  await expect(page.getByTestId(testIds.pricingCard('enterprise'))).toBeVisible();
});

test('/pricing tabela comparativa visível @smoke', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByTestId(testIds.pricingComparisonTable)).toBeVisible();
});

test('redirect legado /planos → /pricing @smoke', async ({ page }) => {
  await page.goto('/planos');
  await expect(page).toHaveURL(/\/pricing$/);
});

test('/demo renderiza com CTA para loja demo @smoke', async ({ page }) => {
  await page.goto('/demo');

  await expect(page.getByTestId(testIds.demoPage)).toBeVisible();

  const storeLink = page.getByTestId(testIds.demoOpenStoreLink);
  await expect(storeLink).toBeVisible();
  await expect(storeLink).toHaveAttribute('href', '/store/demo');
});

test('/store/demo vitrine acessível @smoke', async ({ page }) => {
  const response = await page.goto(storePath());
  if (response?.status() === 404 || response?.status() === 500) {
    test.skip(true, 'Tenant demo não provisionado — aguarda seed ou Fase M6 seed manual.');
    return;
  }
  await expect(page.getByTestId(storeTestIds.slugLayout)).toBeVisible();
});

test('redirect legado /carrinho → /store/{slug}/carrinho @smoke', async ({ page }) => {
  const response = await page.goto('/carrinho');
  expect(page.url()).toMatch(/\/store\/[^/]+\/carrinho/);
  expect(response?.status()).not.toBe(500);
});
