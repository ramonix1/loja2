export interface FreteOpcao {
  id: string;
  nome: string;
  transportadora: string;
  prazo: number | null;
  valor: number;
}

async function calcularViaMelhorEnvio(opts: {
  cepOrigem: string;
  cepDestino: string;
  peso: number;
  altura: number;
  largura: number;
  comprimento: number;
  token: string;
  sandbox: boolean;
}): Promise<FreteOpcao[]> {
  const base = opts.sandbox
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br';

  const resp = await fetch(`${base}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'LojaoSaaS/1.0 suporte@lojao.com.br',
    },
    body: JSON.stringify({
      from: { postal_code: opts.cepOrigem },
      to: { postal_code: opts.cepDestino },
      package: {
        height: parseFloat(String(opts.altura)) || 4,
        width: parseFloat(String(opts.largura)) || 12,
        length: parseFloat(String(opts.comprimento)) || 17,
        weight: (parseInt(String(opts.peso), 10) || 300) / 1000,
      },
      services: '1,2',
      options: { receipt: false, own_hand: false },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Melhor Envio ${resp.status}: ${body.slice(0, 300)}`);
  }

  const data = (await resp.json()) as Array<{
    error?: boolean;
    price?: string;
    id?: number;
    name?: string;
    company?: { name?: string };
    delivery_time?: number;
  }>;

  return data
    .filter((s) => !s.error && s.price)
    .map((s) => ({
      id: String(s.id ?? ''),
      nome: s.name ?? '',
      transportadora: s.company?.name ?? '',
      prazo: s.delivery_time ?? null,
      valor: parseFloat(String(s.price ?? 0)),
    }));
}

export async function calcularOpcoesFrete(opts: {
  cepDestino: string;
  subtotal?: number;
  configs?: Record<string, string>;
}): Promise<FreteOpcao[]> {
  const cepDest = (opts.cepDestino || '').replace(/\D/g, '');
  if (cepDest.length !== 8) throw new Error('CEP de destino inválido');

  const configs = opts.configs ?? {};
  const freteGratisAcima = parseFloat(configs.frete_gratis_acima ?? '0') || 0;
  const freteFixo = parseFloat(configs.frete_fixo ?? '0') || 0;
  const token = configs.melhor_envio_token || '';
  const cepOrigem = (configs.frete_cep_origem || '').replace(/\D/g, '');
  const subtotal = opts.subtotal ?? 0;

  if (freteGratisAcima > 0 && subtotal >= freteGratisAcima) {
    return [{ id: 'gratis', nome: 'Frete Grátis', transportadora: '', prazo: null, valor: 0 }];
  }

  if (token && cepOrigem.length === 8) {
    try {
      const opcoes = await calcularViaMelhorEnvio({
        cepOrigem,
        cepDestino: cepDest,
        peso: parseInt(configs.frete_peso_padrao ?? '300', 10),
        altura: parseFloat(configs.frete_altura ?? '4'),
        largura: parseFloat(configs.frete_largura ?? '12'),
        comprimento: parseFloat(configs.frete_comprimento ?? '17'),
        token,
        sandbox: configs.melhor_envio_sandbox !== 'false',
      });
      if (opcoes.length > 0) return opcoes;
    } catch (err) {
      console.error('[Frete] Melhor Envio:', err instanceof Error ? err.message : err);
    }
  }

  if (freteFixo > 0) {
    return [{ id: 'fixo', nome: 'Entrega padrão', transportadora: '', prazo: null, valor: freteFixo }];
  }

  return [{ id: 'gratis', nome: 'Frete Grátis', transportadora: '', prazo: null, valor: 0 }];
}
