import { parseValorBRL, produtoFieldsSchema } from '@lojao/types/produtos';
import { describe, expect, it } from 'vitest';

describe('parseValorBRL', () => {
  it('aceita decimal normalizado do admin (375.06)', () => {
    expect(parseValorBRL('375.06')).toBe(375.06);
    expect(parseValorBRL('25.90')).toBe(25.9);
  });

  it('aceita formato pt-BR com vírgula', () => {
    expect(parseValorBRL('375,06')).toBe(375.06);
    expect(parseValorBRL('R$ 1.375,06')).toBe(1375.06);
  });

  it('aceita número já parseado', () => {
    expect(parseValorBRL(375.06)).toBe(375.06);
  });

  it('produtoFieldsSchema persiste valor correto via multipart admin', () => {
    const parsed = produtoFieldsSchema.safeParse({
      nome: 'Teste',
      valor: '375.06',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.valor).toBe(375.06);
    }
  });
});
