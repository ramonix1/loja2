import { describe, expect, it, vi } from 'vitest';

import { calcularOpcoesFrete } from '../../src/services/frete.service.js';

describe('Frete service (unit)', () => {
  it('frete grátis quando subtotal >= frete_gratis_acima', async () => {
    const opcoes = await calcularOpcoesFrete({
      cepDestino: '01310100',
      subtotal: 200,
      configs: { frete_gratis_acima: '100', frete_fixo: '15' },
    });
    expect(opcoes).toHaveLength(1);
    expect(opcoes[0]?.id).toBe('gratis');
    expect(opcoes[0]?.valor).toBe(0);
  });

  it('frete fixo quando Melhor Envio indisponível', async () => {
    const opcoes = await calcularOpcoesFrete({
      cepDestino: '01310100',
      subtotal: 10,
      configs: { frete_fixo: '12.50', melhor_envio_token: '' },
    });
    expect(opcoes[0]?.valor).toBe(12.5);
  });

  it('mock Melhor Envio retorna opções', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 1, name: 'PAC', price: '15.00', delivery_time: 5, company: { name: 'Correios' } },
          { id: 2, name: 'SEDEX', price: '25.00', delivery_time: 2, company: { name: 'Correios' } },
        ],
      }),
    );

    const opcoes = await calcularOpcoesFrete({
      cepDestino: '01310100',
      subtotal: 10,
      configs: {
        melhor_envio_token: 'test-token',
        frete_cep_origem: '01310100',
        melhor_envio_sandbox: 'true',
      },
    });

    expect(opcoes.length).toBe(2);
    expect(opcoes[0]?.nome).toBe('PAC');

    vi.unstubAllGlobals();
  });
});
