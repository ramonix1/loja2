import type { Page } from '@playwright/test';

/** Seleciona opção em `FieldSelect` shadcn (Radix) pelo rótulo visível. */
export async function selectFieldOption(
  page: Page,
  testId: string,
  optionLabel: string | RegExp,
): Promise<void> {
  await page.getByTestId(testId).click();
  await page.getByRole('option', { name: optionLabel }).click();
}
