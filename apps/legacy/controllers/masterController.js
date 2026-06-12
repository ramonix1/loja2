const crypto = require('crypto');
const masterDb = require('../config/masterDb');
const asaas = require('../services/asaasService');
const { provisionarTenant } = require('../services/provisioningService');

const MASTER_EMAIL    = () => process.env.MASTER_EMAIL    || 'master@plataforma.com';
const MASTER_PASSWORD = () => process.env.MASTER_PASSWORD || 'troque-em-producao';
const APP_URL         = () => process.env.APP_URL         || 'http://localhost:3000';

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------

exports.requireMaster = (req, res, next) => {
  if (!req.session.isMaster) return res.redirect('/_master/login');
  next();
};

exports.loginPage = (req, res) => {
  if (req.session.isMaster) return res.redirect('/_master');
  res.render('pages/master-login', { erro: req.query.erro || null, csrfToken: res.locals.csrfToken });
};

exports.login = (req, res) => {
  const { email, senha } = req.body;
  if (email === MASTER_EMAIL() && senha === MASTER_PASSWORD()) {
    req.session.isMaster = true;
    return res.redirect('/_master');
  }
  res.redirect('/_master/login?erro=Credenciais+inválidas');
};

exports.logout = (req, res) => {
  req.session.isMaster = false;
  res.redirect('/_master/login');
};

// --------------------------------------------------------------------------
// Dashboard (tabs: leads | tenants | config)
// --------------------------------------------------------------------------

exports.dashboard = async (req, res) => {
  const tab = req.query.tab || 'leads';

  const [leadsR, tenantsR, configR] = await Promise.all([
    masterDb.query('SELECT * FROM leads ORDER BY created_at DESC'),
    masterDb.query(`SELECT id, slug, nome, plano, ativo, gateway_type,
                           fee_percent_override, created_at FROM tenants ORDER BY created_at DESC`),
    masterDb.query('SELECT chave, valor FROM platform_config'),
  ]);

  const config = Object.fromEntries(configR.rows.map(({ chave, valor }) => [chave, valor]));

  // Stats
  const leads  = leadsR.rows;
  const tenants = tenantsR.rows;
  const stats = {
    totalLeads:      leads.length,
    leadsAtivos:     leads.filter(l => l.status === 'ativo').length,
    leadsPendentes:  leads.filter(l => ['novo','em_onboarding','aguardando_pagamento','aguardando_ativacao'].includes(l.status)).length,
    tenantsAtivos:   tenants.filter(t => t.ativo).length,
  };

  res.render('pages/master-dashboard', {
    tab,
    leads,
    tenants,
    config,
    stats,
    appUrl: APP_URL(),
    linkGerado: req.query.token ? `${APP_URL()}/onboarding/${req.query.token}` : null,
    mensagem: req.query.msg  || null,
    erro:     req.query.erro || null,
    csrfToken: res.locals.csrfToken,
  });
};

// --------------------------------------------------------------------------
// Leads
// --------------------------------------------------------------------------

exports.gerarLink = async (req, res) => {
  const { consultor_nome, email, nome_empresa, plano } = req.body;

  if (!consultor_nome?.trim()) {
    return res.redirect('/_master?tab=leads&erro=Nome+do+consultor+obrigatório');
  }

  const token = crypto.randomBytes(32).toString('hex');
  await masterDb.query(
    `INSERT INTO leads (token, nome_contato, email, nome_empresa, plano, consultor_nome, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'novo')`,
    [token, consultor_nome.trim(), email || '', nome_empresa || '', plano || 'basic', consultor_nome.trim()]
  );

  res.redirect(`/_master?tab=leads&msg=Link+gerado&token=${token}`);
};

exports.ativarLead = async (req, res) => {
  const { id } = req.params;
  try {
    const r = await masterDb.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (!r.rows[0]) return res.redirect('/_master?tab=leads&erro=Lead+não+encontrado');

    const lead = r.rows[0];
    if (!lead.slug_desejado) return res.redirect('/_master?tab=leads&erro=Lead+sem+slug+definido.+Peça+ao+cliente+para+preencher+o+cadastro.');

    await provisionarTenant(lead);
    res.redirect('/_master?tab=leads&msg=Tenant+provisionado+com+sucesso');
  } catch (err) {
    console.error('[Master] Erro ao ativar lead:', err.message);
    res.redirect('/_master?tab=leads&erro=' + encodeURIComponent(err.message));
  }
};

exports.cancelarLead = async (req, res) => {
  await masterDb.query(
    "UPDATE leads SET status = 'cancelado', updated_at = NOW() WHERE id = $1",
    [req.params.id]
  );
  res.redirect('/_master?tab=leads&msg=Lead+cancelado');
};

// --------------------------------------------------------------------------
// Tenants
// --------------------------------------------------------------------------

exports.toggleTenant = async (req, res) => {
  const { invalidatePool } = require('../config/tenantDb');
  await masterDb.query('UPDATE tenants SET ativo = NOT ativo WHERE slug = $1', [req.params.slug]);
  invalidatePool(req.params.slug);
  res.redirect('/_master?tab=tenants&msg=Status+do+tenant+atualizado');
};

exports.editarFee = async (req, res) => {
  const { fee } = req.body;
  const valor = fee === '' || fee === undefined ? null : parseFloat(fee);
  await masterDb.query(
    'UPDATE tenants SET fee_percent_override = $1 WHERE slug = $2',
    [valor, req.params.slug]
  );
  res.redirect('/_master?tab=tenants&msg=Taxa+atualizada');
};

// --------------------------------------------------------------------------
// Configurações da plataforma
// --------------------------------------------------------------------------

exports.salvarConfig = async (req, res) => {
  const campos = ['asaas_api_key', 'asaas_env', 'asaas_default_fee_percent', 'asaas_webhook_token'];
  for (const chave of campos) {
    await masterDb.query(
      'UPDATE platform_config SET valor = $1, updated_at = NOW() WHERE chave = $2',
      [req.body[chave] ?? '', chave]
    );
  }
  asaas.invalidarCache();
  res.redirect('/_master?tab=config&msg=Configurações+salvas+com+sucesso');
};
