const { getPool } = require('../config/tenantDb');

// Resolve o slug do tenant a partir da requisiÃ§Ã£o.
// Prioridade: sessÃ£o > env TENANT_SLUG > header X-Tenant-Slug > subdomÃnio
function resolveSlug(req) {
  // SessÃ£o tem prioridade mÃ¡xima (permite trocar de tenant pelo painel de gestÃ£o)
  if (req.session?.tenantSlug) return req.session.tenantSlug;

  // Se TENANT_SLUG estÃ¡ definido no ambiente, usa como fallback
  if (process.env.TENANT_SLUG) return process.env.TENANT_SLUG;

  // Header explÃcito (Ãºtil para ferramentas como Postman)
  if (req.headers['x-tenant-slug']) return req.headers['x-tenant-slug'];

  // Em produÃ§Ã£o: subdomÃnio real (ex: sapataria-mario.sualoja.com.br)
  const hostname = req.hostname || '';
  const parts = hostname.split('.');
  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const hasSubdomain = !isIp && parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost';

  if (hasSubdomain) return parts[0];

  return null;
}

async function tenantMiddleware(req, res, next) {
  const slug = resolveSlug(req);

  if (!slug) {
    if (process.env.NODE_ENV !== 'production') {
      return res.redirect('/_tenants?erro=Nenhum+tenant+selecionado.+Escolha+um+abaixo.');
    }
    return res.status(400).render('pages/error', {
      message: 'Tenant nÃ£o identificado. Configure o subdomÃnio ou o header X-Tenant-Slug.',
    });
  }

  try {
    req.tenantSlug = slug;
    req.db = await getPool(slug);
    next();
  } catch (err) {
    console.error(`[Tenant] Erro ao conectar tenant "${slug}":`, err.message);
    if (!res.locals.loja) res.locals.loja = { nome: 'LojÃ£o', slogan: '', logo: '', favicon: '', cor_primaria: '#2563eb', rodape: '', email: '', whatsapp: '' };
    res.status(404).render('pages/error', { message: 'Loja nÃ£o encontrada.' });
  }
}

module.exports = tenantMiddleware;
