/**
 * Proxy para a API Fastify quando feature flags USE_NEW_* estão ativas.
 * Mantém EJS/checkout legacy funcionando enquanto o backend migra.
 */

const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');

function flag(name) {
  return process.env[name] === 'true';
}

exports.isNewCart = () => flag('USE_NEW_CART');
exports.isNewCheckout = () => flag('USE_NEW_CHECKOUT');
exports.isNewWebhooks = () => flag('USE_NEW_WEBHOOKS');
exports.isNewChat = () => flag('USE_NEW_CHAT');

/**
 * Encaminha requisição ao Fastify preservando cookie e tenant.
 */
exports.proxyToApi = async function proxyToApi(req, res, apiPath, opts = {}) {
  const method = opts.method || req.method;
  const slug =
    req.session?.tenantSlug || process.env.TENANT_SLUG || req.headers['x-tenant-slug'] || 'loja';

  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': slug,
  };

  if (req.headers.cookie) headers.Cookie = req.headers.cookie;

  let body;
  if (method !== 'GET' && method !== 'HEAD') {
    body = opts.body !== undefined ? JSON.stringify(opts.body) : JSON.stringify(req.body ?? {});
  }

  try {
    const response = await fetch(`${API_URL}${apiPath}`, {
      method,
      headers,
      body,
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) res.setHeader('Set-Cookie', setCookie);

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (opts.legacyJsonShape) {
      return res.status(response.status).json(opts.legacyJsonShape(json, response.status));
    }

    return res.status(response.status).json(json);
  } catch (err) {
    console.error('[newApiProxy] Erro ao proxy:', err.message);
    return res.status(502).json({ erro: 'API indisponível.' });
  }
};

/** Middleware: bloqueia rota legacy quando webhook migrado para API. */
exports.blockIfNewWebhooks = function blockIfNewWebhooks(req, res, next) {
  if (exports.isNewWebhooks()) {
    return res.status(410).json({ error: 'Webhook migrado para API (:3001/webhook/*)' });
  }
  next();
};

/** Middleware: bloqueia socket legacy quando chat migrado. */
exports.skipLegacySocket = function skipLegacySocket() {
  return !exports.isNewChat();
};
