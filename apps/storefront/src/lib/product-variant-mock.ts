export type MockVariant = {
  id: string;
  label: string;
  colorHex?: string;
  /** Opcional: troca imagem principal na galeria. */
  imageUrl?: string;
};

const SWATCH_LABELS = ['Grafite', 'Neutro', 'Claro', 'Padrão loja'] as const;

const NEUTRAL_SWATCHES = ['#9ca3af', '#d1d5db', '#e5e7eb'] as const;

function hashProductId(productId: number): number {
  return Math.abs(productId * 2_654_435_761) % 1_000_000;
}

function isMockEnabled(): boolean {
  return process.env.NEXT_PUBLIC_VARIANT_MOCK !== '0';
}

/**
 * Variantes demonstrativas — determinísticas por produto (§5.13).
 * Nunca enviadas ao carrinho nesta fase.
 */
export function getMockVariants(
  productId: number,
  _productName: string,
  imageUrls: string[] = [],
): MockVariant[] {
  if (!isMockEnabled()) return [];

  const hash = hashProductId(productId);
  const count = 2 + (hash % 3);
  const variants: MockVariant[] = [];

  for (let i = 0; i < count; i += 1) {
    const isStoreColor = i === count - 1;
    variants.push({
      id: `mock-${productId}-${i}`,
      label: isStoreColor ? SWATCH_LABELS[3] : SWATCH_LABELS[i] ?? `Opção ${i + 1}`,
      colorHex: isStoreColor ? undefined : NEUTRAL_SWATCHES[i % NEUTRAL_SWATCHES.length],
      imageUrl: imageUrls[i + 1] ?? imageUrls[0],
    });
  }

  return variants;
}
