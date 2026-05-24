const { getPool } = require('../config/tenantDb');

// Resolve o slug do tenant a partir da requisição.
// Prioridade: sessão > env TENANT_SLUG > header X-Tenant-Slug > subdomínio
function resolveSlug(req) {
  // Sessão tem prioridade máxima (permite trocar de tenant pelo painel de gestão)
  if (req.session?.tenantSlug) return req.session.tenantSlug;

  // Se TENANT_SLUG está definido no ambiente, usa como fallback
  if (process.env.TENANT_SLUG) return process.env.TENANT_SLUG;

  // Header explícito (útil para ferramentas como Postman)
  if (req.headers['x-tenant-slug']) return req.headers['x-tenant-slug'];

  // Em produção: subdomínio real (ex: sapataria-mario.sualoja.com.br)
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
      message: 'Tenant não identificado. Configure o subdomínio ou o header X-Tenant-Slug.',
    });
  }

  try {
    req.tenantSlug = slug;
    req.db = await getPool(slug);
    next();
  } catch (err) {
    console.error(`[Tenant] Erro ao conectar tenant "${slug}":`, err.message);
    res.status(404).render('pages/error', { message: 'Loja não encontrada.' });
  }
}

module.exports = tenantMiddleware;
