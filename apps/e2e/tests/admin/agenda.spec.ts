import { test, expect } from '@playwright/test';
import { testIds } from '@lojao/test-utils/test-ids';

test('admin agenda calendario @smoke', async ({ page }) => {
  await page.goto('/admin/agenda');
  await expect(page.getByTestId(testIds.adminAgenda.panel)).toBeVisible();
  await expect(page.getByTestId(testIds.adminAgenda.calendar)).toBeVisible();
  await expect(page.getByTestId(testIds.adminAgenda.configForm)).toBeVisible();
});

test('admin agenda navega mes', async ({ page }) => {
  await page.goto('/admin/agenda');
  await page.getByTestId(testIds.adminAgenda.calendarNextBtn).click();
  await expect(page).toHaveURL(/\?mes=/);
});
