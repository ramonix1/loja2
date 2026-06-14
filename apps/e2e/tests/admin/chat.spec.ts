import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin chat painel @smoke', async ({ page }) => {
  await page.goto('/admin/chat');
  await expect(page.getByTestId(testIds.adminChat.panel)).toBeVisible();
  await expect(page.getByTestId(testIds.adminChat.conversasList)).toBeVisible();
});

test('admin chat input e enviar visiveis ao selecionar conversa', async ({ page }) => {
  await page.goto('/admin/chat');
  const conversa = page.locator('[data-testid^="admin-chat-conversa-"]').first();
  if ((await conversa.count()) === 0) {
    await expect(page.getByTestId(testIds.adminChat.emptyState)).toBeVisible();
    return;
  }
  await conversa.click();
  await expect(page.getByTestId(testIds.adminChat.input)).toBeVisible();
  await expect(page.getByTestId(testIds.adminChat.sendBtn)).toBeVisible();
});
