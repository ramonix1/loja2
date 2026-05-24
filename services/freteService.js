async function calcularViaMelhorEnvio({ cepOrigem, cepDestino, peso, altura, largura, comprimento, token, sandbox }) {
  const base = sandbox
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br';

  const resp = await fetch(`${base}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'LojaoSaaS/1.0 suporte@lojao.com.br',
    },
    body: JSON.stringify({
      from: { postal_code: cepOrigem },
      to:   { postal_code: cepDestino },
      package: {
        height: parseFloat(altura)    || 4,
        width:  parseFloat(largura)   || 12,
        length: parseFloat(comprimento) || 17,
        weight: (parseInt(peso) || 300) / 1000, // g → kg
      },
      services: '1,2', // PAC e SEDEX
      options: { receipt: false, own_hand: false },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Melhor Envio ${resp.status}: ${body.slice(0, 300)}`);
  }

  const data = await resp.json();

  return data
    .filter(s => !s.error && s.price)
    .map(s => ({
      id:            String(s.id),
      nome:          s.name,
      transportadora: s.company?.name || '',
      prazo:         s.delivery_time || null,
      valor:         parseFloat(s.price),
    }));
}

async function calcularOpcoesFrete({ cepDestino, subtotal = 0, configs = {} }) {
  const cepDest = (cepDestino || '').replace(/\D/g, '');
  if (cepDest.length !== 8) throw new Error('CEP de destino inválido');

  const freteGratisAcima = parseFloat(configs.frete_gratis_acima) || 0;
  const freteFixo        = parseFloat(configs.frete_fixo)         || 0;
  const token            = configs.melhor_envio_token              || '';
  const cepOrigem        = (configs.frete_cep_origem || '').replace(/\D/g, '');

  // Frete grátis por valor mínimo do pedido
  if (freteGratisAcima > 0 && subtotal >= freteGratisAcima) {
    return [{ id: 'gratis', nome: 'Frete Grátis', transportadora: '', prazo: null, valor: 0 }];
  }

  // Melhor Envio
  if (token && cepOrigem.length === 8) {
    try {
      const opcoes = await calcularViaMelhorEnvio({
        cepOrigem,
        cepDestino: cepDest,
        peso:        configs.frete_peso_padrao || 300,
        altura:      configs.frete_altura      || 4,
        largura:     configs.frete_largura     || 12,
        comprimento: configs.frete_comprimento || 17,
        token,
        sandbox: configs.melhor_envio_sandbox !== 'false',
      });
      if (opcoes.length > 0) return opcoes;
    } catch (err) {
      console.error('[Frete] Melhor Envio:', err.message);
    }
  }

  // Frete fixo configurado
  if (freteFixo > 0) {
    return [{ id: 'fixo', nome: 'Entrega padrão', transportadora: '', prazo: null, valor: freteFixo }];
  }

  // Padrão: grátis
  return [{ id: 'gratis', nome: 'Frete Grátis', transportadora: '', prazo: null, valor: 0 }];
}

module.exports = { calcularOpcoesFrete };
