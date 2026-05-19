const express = require('express');
const router = express.Router();
const checkout = require('../controllers/checkoutController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

router.get('/checkout', requireAuth, checkout.exibirCheckout);
router.post('/checkout', requireAuth, checkout.processarCheckout);
router.get('/checkout/resultado/:id', requireAuth, checkout.exibirResultado);
router.get('/meus-pedidos', requireAuth, checkout.meusPedidos);

router.post('/webhook/mercadopago', checkout.webhook);
router.post('/webhook/sumup', checkout.webhookSumup);

// SumUp maquininha
router.get('/checkout/aguardando-maquininha/:id', requireAuth, checkout.aguardandoMaquininha);
router.get('/checkout/status-maquininha/:pedidoId/:tid', requireAuth, checkout.statusMaquininha);
router.post('/checkout/cancelar-maquininha/:pedidoId/:tid', requireAuth, checkout.cancelarMaquininha);

router.get('/admin/sumup/diagnostico', requireAdmin, checkout.sumupDiagnostico);
router.get('/admin/pedidos', requireAdmin, checkout.adminPedidos);
router.get('/admin/pedidos/:id', requireAdmin, checkout.adminDetalhePedido);
router.post('/admin/pedidos/:id/status', requireAdmin, checkout.adminAtualizarStatus);

module.exports = router;
