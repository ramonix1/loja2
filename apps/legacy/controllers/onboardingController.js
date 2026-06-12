const crypto = require('crypto');
const masterDb = require('../config/masterDb');
const asaas = require('../services/asaasService');
const { provisionarTenant } = require('../services/provisioningService');

const PLANOS = {
  basic: {
    id: 'basic',
    nome: 'Basic',
    preco: 99,
    fee: 1.50,
    descricao: 'Ideal para começar',
    recursos: ['Até 100 pedidos/mês', 'Gateway de pagamento incluso', 'Suporte por email'],
  },
  pro: {
    id: 'pro',
    nome: 'Pro',
    preco: 199,
    fee: 1.00,
    descricao: 'Para quem está crescendo',
    recursos: ['Até 500 pedidos/mês', 'Taxa de transação reduzida', 'Suporte prioritário', 'Relatórios avançados'],
  },
  premium: {
    id: 'premium',
    nome: 'Premium',
    preco: 399,
    fee: 0.50,
    descricao: 'Sem limites',
    recursos: ['Pedidos ilimitados', 'Menor taxa de transação', 'Suporte dedicado', 'White-label completo'],
  },
};

// GET /onboarding
exports.landing = (req, res) => {
  res.render('pages/onboarding-landing', { planos: Object.values(PLANOS) });
};

// GET /onboarding/cadastro  ou  GET /onboarding/:token
exports.cadastro = async (req, res) => {
  const { token } = req.params;
  const plano = req.query.plano || 'basic';

  let lead = null;
  if (token) {
    const r = await masterDb.query(
      "SELECT * FROM leads WHERE token = $1 AND status NOT IN ('ativo','cancelado')",
      [token]
    );
    lead = r.rows[0] || null;
    if (!lead) return res.redirect('/onboarding?erro=Link+inválido+ou+expirado.');
  }

  res.render('pages/onboarding-cadastro', {
    lead,
    plano: PLANOS[plano] || PLANOS.basic,
    planos: Object.values(PLANOS),
    csrfToken: res.locals.csrfToken,
    erro: req.query.erro || null,
  });
};

// POST /onboarding/cadastro
exports.salvarCadastro = async (req, res) => {
  const { nome_contato, email, telefone, nome_empresa, cpf_cnpj, slug_desejado, plano, termos, token_lead } = req.body;

  const erros = [];
  if (!nome_contato?.trim()) erros.push('Nome obrigatório.');
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('Email inválido.');
  if (!nome_empresa?.trim()) erros.push('Nome da empresa obrigatório.');
  if (!slug_desejado?.trim() || !/^[a-z0-9-]{3,50}$/.test(slug_desejado)) {
    erros.push('Subdomínio inválido. Use apenas letras minúsculas, números e hífen (3–50 caracteres).');
  }
  if (!termos) erros.push('É necessário aceitar os termos de uso.');
  if (!PLANOS[plano]) erros.push('Plano inválido.');

  if (erros.length) {
    return res.render('pages/onboarding-cadastro', {
      lead: req.body,
      plano: PLANOS[plano] || PLANOS.basic,
      planos: Object.values(PLANOS),
      csrfToken: res.locals.csrfToken,
      erro: erros.join(' '),
    });
  }

  // Verificar slug único
  const slugExiste = await masterDb.query(
    "SELECT id FROM tenants WHERE slug = $1 UNION SELECT id FROM leads WHERE slug_desejado = $1 AND status NOT IN ('cancelado')",
    [slug_desejado]
  );
  if (slugExiste.rows.length > 0) {
    return res.render('pages/onboarding-cadastro', {
      lead: req.body,
      plano: PLANOS[plano] || PLANOS.basic,
      planos: Object.values(PLANOS),
      csrfToken: res.locals.csrfToken,
      erro: 'Este subdomínio já está em uso. Escolha outro.',
    });
  }

  // Criar ou atualizar lead
  let lead;
  if (token_lead) {
    const r = await masterDb.query(
      `UPDATE leads SET nome_contato=$1, email=$2, telefone=$3, nome_empresa=$4, cpf_cnpj=$5,
        slug_desejado=$6, plano=$7, termos_aceitos_em=NOW(), status='em_onboarding', updated_at=NOW()
       WHERE token=$8 RETURNING *`,
      [nome_contato, email, telefone, nome_empresa, cpf_cnpj, slug_desejado, plano, token_lead]
    );
    lead = r.rows[0];
  } else {
    const token = crypto.randomBytes(32).toString('hex');
    const r = await masterDb.query(
      `INSERT INTO leads (token, nome_contato, email, telefone, nome_empresa, cpf_cnpj, slug_desejado, plano, termos_aceitos_em, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),'em_onboarding') RETURNING *`,
      [token, nome_contato, email, telefone, nome_empresa, cpf_cnpj, slug_desejado, plano]
    );
    lead = r.rows[0];
  }

  req.session.leadToken = lead.token;

  // Tentar criar cobrança Asaas
  try {
    const config = await asaas.getPlatformConfig();
    if (config.asaas_api_key) {
      const planoInfo = PLANOS[lead.plano];
      const vencimento = _proximoDiaUtil();

      const cliente = await asaas.obterOuCriarCliente({
        nome: lead.nome_contato,
        email: lead.email,
        cpfCnpj: lead.cpf_cnpj || '',
        telefone: lead.telefone || '',
      });

      const cobranca = await asaas.criarCobranca({
        customerId: cliente.id,
        valor: planoInfo.preco,
        vencimento,
        tipoPagamento: 'PIX',
        descricao: `Plano ${planoInfo.nome} — ${lead.nome_empresa}`,
        pedidoId: `lead_${lead.id}`,
        walletId: null,
        feePercent: 0,
      });

      await masterDb.query(
        `UPDATE leads SET asaas_customer_id=$1, asaas_payment_id=$2, status='aguardando_pagamento', updated_at=NOW() WHERE id=$3`,
        [cliente.id, cobranca.id, lead.id]
      );

      // Buscar QR code PIX
      const pix = await asaas.obterQrCodePix(cobranca.id);
      req.session.pixData = { qrcode: pix.encodedImage, copiacola: pix.payload, valor: planoInfo.preco };
    } else {
      await masterDb.query(
        "UPDATE leads SET status='aguardando_ativacao', updated_at=NOW() WHERE id=$1",
        [lead.id]
      );
    }
  } catch (err) {
    console.error('[Onboarding] Erro Asaas:', err.message);
    await masterDb.query(
      "UPDATE leads SET status='aguardando_ativacao', updated_at=NOW() WHERE id=$1",
      [lead.id]
    );
  }

  res.redirect('/onboarding/pagamento');
};

// GET /onboarding/pagamento
exports.pagamento = async (req, res) => {
  const token = req.session.leadToken;
  if (!token) return res.redirect('/onboarding');

  const r = await masterDb.query('SELECT * FROM leads WHERE token=$1', [token]);
  const lead = r.rows[0];
  if (!lead) return res.redirect('/onboarding');

  if (lead.status === 'ativo') return res.redirect('/onboarding/sucesso');

  const pix = req.session.pixData || null;
  const plano = PLANOS[lead.plano] || PLANOS.basic;

  res.render('pages/onboarding-pagamento', { lead, plano, pix });
};

// GET /onboarding/status  (polling JSON)
exports.status = async (req, res) => {
  const token = req.session.leadToken;
  if (!token) return res.json({ status: 'desconhecido' });

  const r = await masterDb.query('SELECT status FROM leads WHERE token=$1', [token]);
  res.json({ status: r.rows[0]?.status || 'desconhecido' });
};

// POST /onboarding/webhook  (Asaas)
exports.webhook = async (req, res) => {
  try {
    const payload = await asaas.processarWebhook(req.body, req.headers['asaas-access-token']);
    const event = payload.event;
    const payment = payload.payment;

    if ((event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') && payment?.id) {
      const r = await masterDb.query(
        "SELECT * FROM leads WHERE asaas_payment_id=$1 AND status='aguardando_pagamento'",
        [payment.id]
      );
      if (r.rows[0]) await provisionarTenant(r.rows[0]);
    }
  } catch (err) {
    console.error('[Onboarding Webhook] Erro:', err.message);
  }
  res.sendStatus(200);
};

// GET /onboarding/sucesso
exports.sucesso = async (req, res) => {
  const token = req.session.leadToken;
  let lead = null;
  if (token) {
    const r = await masterDb.query('SELECT * FROM leads WHERE token=$1', [token]);
    lead = r.rows[0] || null;
  }
  delete req.session.leadToken;
  delete req.session.pixData;
  res.render('pages/onboarding-sucesso', { lead });
};


function _proximoDiaUtil() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
