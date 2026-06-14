/** Junta classes condicionais (mini-clsx, sem dependências). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
