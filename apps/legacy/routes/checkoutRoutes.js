const express = require('express');
const router = express.Router();
const checkout = require('../controllers/checkoutController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { checkoutLimiter } = require('../middlewares/rateLimiter');
const { adminRedirect } = require('../utils/adminRedirect');
const { isNewCheckout, isNewWebhooks, proxyToApi, blockIfNewWebhooks } = require('../utils/newApiProxy');

const adminBase = (process.env.ADMIN_URL || 'http://localhost:5173').replace(/\/$/, '');

router.get('/checkout', requireAuth, checkout.exibirCheckout);
router.post('/checkout', requireAuth, checkoutLimiter, async (req, res) => {
  if (isNewCheckout()) {
    try {
      const slug = req.session?.tenantSlug || process.env.TENANT_SLUG || 'loja';
      const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const response = await fetch(`${API_URL}/api/v1/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': slug,
          Cookie: req.headers.cookie || '',
        },
        body: JSON.stringify(req.body),
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) res.setHeader('Set-Cookie', setCookie);
      const json = await response.json();
      if (!response.ok) {
        const code = json.code || 'pagamento';
        return res.redirect(`/checkout?erro=${code === 'INSUFFICIENT_STOCK' ? 'estoque' : 'pagamento'}`);
      }
      const pedidoId = json.data?.pedido_id;
      const redirectUrl = json.data?.redirect_url;
      if (redirectUrl && redirectUrl.startsWith('http')) return res.redirect(redirectUrl);
      if (redirectUrl) return res.redirect(redirectUrl);
      return res.redirect(`/checkout/resultado/${pedidoId}`);
    } catch (err) {
      console.error('[Checkout proxy] Erro:', err.message);
      return res.redirect('/checkout?erro=pagamento');
    }
  }
  return checkout.processarCheckout(req, res);
});
router.get('/checkout/resultado/:id', requireAuth, checkout.exibirResultado);
router.get('/meus-pedidos', requireAuth, checkout.meusPedidos);

router.post('/webhook/stripe', blockIfNewWebhooks, checkout.webhookStripe);
router.post('/webhook/sumup', blockIfNewWebhooks, checkout.webhookSumup);

// Fase 3: pedidos admin migrados para React
router.get('/admin/pedidos', requireAdmin, adminRedirect('/admin/pedidos'));
router.get('/admin/pedidos/:id', requireAdmin, (req, res) => {
  res.redirect(302, `${adminBase}/admin/pedidos/${req.params.id}`);
});
router.post('/admin/pedidos/:id/status', requireAdmin, (req, res) => {
  res.redirect(302, `${adminBase}/admin/pedidos/${req.params.id}`);
});

module.exports = router;
