const express = require('express');
const router = express.Router();
const checkout = require('../controllers/checkoutController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { checkoutLimiter } = require('../middlewares/rateLimiter');

router.get('/checkout', requireAuth, checkout.exibirCheckout);
router.post('/checkout', requireAuth, checkoutLimiter, checkout.processarCheckout);
router.get('/checkout/resultado/:id', requireAuth, checkout.exibirResultado);
router.get('/meus-pedidos', requireAuth, checkout.meusPedidos);

router.post('/webhook/stripe', checkout.webhookStripe);
router.post('/webhook/sumup', checkout.webhookSumup);

router.get('/admin/pedidos', requireAdmin, checkout.adminPedidos);
router.get('/admin/pedidos/:id', requireAdmin, checkout.adminDetalhePedido);
router.post('/admin/pedidos/:id/status', requireAdmin, checkout.adminAtualizarStatus);

module.exports = router;
