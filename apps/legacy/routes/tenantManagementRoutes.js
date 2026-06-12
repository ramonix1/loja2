const express = require('express');
const router = express.Router();
const masterDb = require('../config/masterDb');
const { invalidatePool } = require('../config/tenantDb');

// SÃ³ disponÃvel em desenvolvimento
function devOnly(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  next();
}

// Listar todos os tenants
router.get('/', devOnly, async (req, res) => {
  try {
    const r = await masterDb.query(
      'SELECT id, slug, nome, db_host, db_port, db_name, db_user, plano, ativo, url_propria, created_at FROM tenants ORDER BY id'
    );
    res.render('pages/tenant-management', {
      tenants: r.rows,
      tenantAtual: req.session.tenantSlug || process.env.TENANT_SLUG || null,
      mensagem: req.query.msg || null,
      erro: req.query.erro || null,
    });
  } catch (err) {
    console.error('[TenantMgmt] Erro ao listar tenants:', err.message);
    res.status(500).send('Erro ao carregar tenants: ' + err.message);
  }
});

// Trocar tenant ativo na sessÃ£o
router.post('/switch/:slug', devOnly, async (req, res) => {
  const { slug } = req.params;
  try {
    const r = await masterDb.query('SELECT id FROM tenants WHERE slug = $1', [slug]);
    if (!r.rows[0]) {
      return res.redirect('/_tenants?erro=Tenant+nÃ£o+encontrado');
    }
    req.session.tenantSlug = slug;
    req.session.usuarioId = null;
    req.session.nome = null;
    req.session.role = null;
    res.redirect('/_tenants?msg=Tenant+trocado+para+' + encodeURIComponent(slug));
  } catch (err) {
    res.redirect('/_tenants?erro=' + encodeURIComponent(err.message));
  }
});

// Resetar conexÃ£o do pool
router.post('/reset/:slug', devOnly, async (req, res) => {
  const { slug } = req.params;
  try {
    invalidatePool(slug);
    res.redirect('/_tenants?msg=ConexÃ£o+resetada+para+' + encodeURIComponent(slug));
  } catch (err) {
    res.redirect('/_tenants?erro=' + encodeURIComponent(err.message));
  }
});

// Ativar/desativar tenant
router.post('/toggle/:slug', devOnly, async (req, res) => {
  const { slug } = req.params;
  try {
    await masterDb.query(
      'UPDATE tenants SET ativo = NOT ativo WHERE slug = $1',
      [slug]
    );
    invalidatePool(slug);
    res.redirect('/_tenants?msg=Status+atualizado+para+' + encodeURIComponent(slug));
  } catch (err) {
    res.redirect('/_tenants?erro=' + encodeURIComponent(err.message));
  }
});

// Trocar e acessar a loja diretamente
router.get('/acessar/:slug', devOnly, async (req, res) => {
  const { slug } = req.params;
  try {
    const r = await masterDb.query('SELECT id, url_propria FROM tenants WHERE slug = $1', [slug]);
    if (!r.rows[0]) {
      return res.redirect('/_tenants?erro=Tenant+nÃ£o+encontrado');
    }
    req.session.tenantSlug = slug;
    req.session.usuarioId = null;
    req.session.nome = null;
    req.session.role = null;
    res.redirect('/');
  } catch (err) {
    res.redirect('/_tenants?erro=' + encodeURIComponent(err.message));
  }
});

module.exports = router;
