import { z } from 'zod';

/** Tema visual da vitrine (header e navegação). */
export const storeThemeSchema = z.enum(['escuro', 'claro']);
export type StoreTheme = z.infer<typeof storeThemeSchema>;

export const DEFAULT_STORE_THEME: StoreTheme = 'escuro';

export function parseStoreTheme(value: string | undefined | null): StoreTheme {
  const parsed = storeThemeSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_STORE_THEME;
}
