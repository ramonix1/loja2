/** Formata número para exibição BRL (R$ 10,50). */
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Máscara de input monetário a partir de dígitos. */
export function maskBRLInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const cents = Number(digits) / 100;
  return formatBRL(cents);
}

/** Converte string mascarada em número. */
export function parseBRLInput(masked: string): number {
  const digits = masked.replace(/\D/g, '');
  return Number(digits) / 100;
}
