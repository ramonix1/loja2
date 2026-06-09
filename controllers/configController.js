async function getConfigs(db) {
  try {
    const r = await db.query('SELECT chave, valor FROM configuracoes');
    const cfg = {};
    r.rows.forEach(row => { cfg[row.chave] = row.valor; });
    return cfg;
  } catch {
    return {};
  }
}

exports.getConfigs = getConfigs;

exports.exibirConfiguracoes = async (req, res) => {
  try {
    const configs = await getConfigs(req.db);
    res.render('pages/admin-configuracoes', {
      configs,
      activePage: 'configuracoes',
      salvo: req.query.salvo === '1',
      erro: req.query.erro === '1',
    });
  } catch (err) {
    console.error('Erro configurações:', err);
    res.status(500).render('pages/error', { message: 'Erro ao carregar configurações' });
  }
};

exports.diagnostico = async (req, res) => {
  const resultados = [];

  // MP Access Token
  const mpToken = process.env.MP_ACCESS_TOKEN || '';
  const mpPublicKey = process.env.MP_PUBLIC_KEY || '';
  const sumupKey = process.env.SUMUP_API_KEY || '';
  const sumupMerchant = process.env.SUMUP_MERCHANT_CODE || '';
  const appUrl = process.env.APP_URL || '';

  resultados.push({
    nome: 'MP_ACCESS_TOKEN',
    ok: mpToken.length > 20,
    valor: mpToken ? `${mpToken.slice(0, 12)}...` : '(vazio)',
    dica: mpToken ? null : 'Configure no .env: MP_ACCESS_TOKEN=APP-xxx ou TEST-xxx',
  });
  resultados.push({
    nome: 'MP_PUBLIC_KEY',
    ok: mpPublicKey.length > 10,
    valor: mpPublicKey ? `${mpPublicKey.slice(0, 12)}...` : '(vazio)',
    dica: mpPublicKey ? null : 'Configure no .env: MP_PUBLIC_KEY=APP-xxx ou TEST-xxx',
  });
  resultados.push({
    nome: 'SUMUP_API_KEY',
    ok: sumupKey.length > 10,
    valor: sumupKey ? `${sumupKey.slice(0, 12)}...` : '(vazio)',
    dica: sumupKey ? null : 'Configure no .env: SUMUP_API_KEY=sup_sk_xxx',
  });
  resultados.push({
    nome: 'SUMUP_MERCHANT_CODE',
    ok: sumupMerchant.length > 3,
    valor: sumupMerchant || '(vazio)',
    dica: sumupMerchant ? null : 'Configure no .env: SUMUP_MERCHANT_CODE=MXXXXXXXX',
  });
  resultados.push({
    nome: 'APP_URL',
    ok: appUrl.startsWith('http'),
    valor: appUrl || '(vazio)',
    dica: appUrl ? null : 'Configure no .env: APP_URL=https://sua-url.ngrok-free.app',
  });

  // Testar MP API � qualquer resposta da API (mesmo 404) significa token válido
  let mpApiOk = false, mpApiErro = null;
  if (mpToken) {
    try {
      const { MercadoPagoConfig, Payment } = require('mercadopago');
      const client = new MercadoPagoConfig({ accessToken: mpToken, options: { timeout: 8000 } });
      const p = new Payment(client);
      await p.get({ id: '1' }).catch(e => {
        const status = e.statusCode || e.status || (e.cause?.status);
        const msg = (e.message || '').toLowerCase();
        // 404 / "not found" / "payment not found" = API acess�vel, token válido
        if (status === 404 || msg.includes('not found') || msg.includes('payment')) {
          mpApiOk = true;
        } else if (status === 401 || status === 403) {
          mpApiErro = `Token inválido (HTTP ${status})`;
        } else {
          mpApiOk = true; // qualquer outra resposta = conectou
        }
      });
      if (!mpApiErro) mpApiOk = true;
    } catch (e) {
      mpApiErro = e.message || String(e);
    }
  }
  resultados.push({
    nome: 'Conexão MP API',
    ok: mpApiOk,
    valor: mpApiOk ? 'OK � token válido, API acess�vel' : (mpApiErro || 'Não testado'),
    dica: !mpApiOk && mpToken ? `Erro: ${mpApiErro}` : null,
  });

  // Testar SumUp API
  let sumupApiOk = false, sumupApiErro = null;
  if (sumupKey) {
    try {
      const sumup = require('../services/sumupService');
      await sumup.consultarCheckout('test-diagnostico').catch(e => {
        if (e.statusCode === 404 || e.message?.includes('Not Found')) sumupApiOk = true;
        else throw e;
      });
      if (!sumupApiOk) sumupApiOk = true;
    } catch (e) {
      sumupApiErro = e.message || String(e);
      if (e.statusCode === 401 || e.statusCode === 403) sumupApiErro = `Token inválido (${e.statusCode})`;
      else if (e.statusCode === 404) sumupApiOk = true;
    }
  }
  resultados.push({
    nome: 'Conexão SumUp API',
    ok: sumupApiOk,
    valor: sumupApiOk ? 'OK � API respondeu' : (sumupApiErro || 'Não testado'),
    dica: !sumupApiOk && sumupKey ? `Erro: ${sumupApiErro}` : null,
  });

  res.render('pages/admin-diagnostico', { resultados, activePage: 'configuracoes' });
};

exports.salvarConfiguracoes = async (req, res) => {
  const {
    controla_estoque, reservar_estoque_carrinho, modulo_agenda, habilitar_sumup,
    frete_cep_origem, frete_fixo, frete_gratis_acima,
    melhor_envio_token, melhor_envio_sandbox,
    frete_peso_padrao, frete_altura, frete_largura, frete_comprimento,
  } = req.body;
  try {
    const pares = [
      ['controla_estoque',          controla_estoque === 'on' ? 'true' : 'false'],
      ['reservar_estoque_carrinho', reservar_estoque_carrinho === 'on' ? 'true' : 'false'],
      ['modulo_agenda',             modulo_agenda === 'on' ? 'true' : 'false'],
      ['habilitar_sumup',           habilitar_sumup === 'on' ? 'true' : 'false'],
      ['frete_cep_origem',          (frete_cep_origem || '').replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2')],
      ['frete_fixo',                String(parseFloat(frete_fixo) || 0)],
      ['frete_gratis_acima',        String(parseFloat(frete_gratis_acima) || 0)],
      ['melhor_envio_token',        (melhor_envio_token || '').trim()],
      ['melhor_envio_sandbox',      melhor_envio_sandbox === 'on' ? 'true' : 'false'],
      ['frete_peso_padrao',         String(parseInt(frete_peso_padrao) || 300)],
      ['frete_altura',              String(parseFloat(frete_altura) || 4)],
      ['frete_largura',             String(parseFloat(frete_largura) || 12)],
      ['frete_comprimento',         String(parseFloat(frete_comprimento) || 17)],
    ];
    for (const [chave, valor] of pares) {
      await req.db.query(`
        INSERT INTO configuracoes (chave, valor, updated_at) VALUES ($1, $2, NOW())
        ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()
      `, [chave, valor]);
    }
    res.redirect('/admin/configuracoes?salvo=1');
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    res.redirect('/admin/configuracoes?erro=1');
  }
};
