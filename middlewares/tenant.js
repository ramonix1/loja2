const { getPool } = require('../config/tenantDb');

// Resolve o slug do tenant a partir da requisição.
// Prioridade: subdomínio > header X-Tenant-Slug > env TENANT_SLUG
function resolveSlug(req) {
  const hostname = req.hostname || '';
  const parts = hostname.split('.');

  // Em produção: sapataria-mario.sualoja.com.br → partes[0] = "sapataria-mario"
  // Em desenvolvimento com /etc/hosts: sapataria.localhost → partes[0] = "sapataria"
  // Ignora "www" e hosts simples como "localhost" ou "127.0.0.1"
  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const hasSubdomain = !isIp && parts.length >= 2 && parts[0] !== 'www';

  if (hasSubdomain && parts[0] !== 'localhost') {
    return parts[0];
  }

  // Fallback para desenvolvimento: header ou env
  return req.headers['x-tenant-slug'] || process.env.TENANT_SLUG || null;
}

async function tenantMiddleware(req, res, next) {
  const slug = resolveSlug(req);

  if (!slug) {
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
