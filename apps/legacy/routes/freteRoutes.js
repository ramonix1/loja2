const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { calcularOpcoesFrete } = require('../services/freteService');
const { getConfigs } = require('../controllers/configController');
const { isNewCheckout, proxyToApi } = require('../utils/newApiProxy');

router.post('/frete/calcular', requireAuth, async (req, res) => {
  if (isNewCheckout()) {
    return proxyToApi(req, res, '/api/v1/shipping/calculate', {
      body: {
        cep_destino: req.body.cep_destino,
        subtotal: parseFloat(req.body.subtotal) || 0,
      },
      legacyJsonShape: (json, status) =>
        status >= 400
          ? { ok: false, erro: json.error, opcoes: [] }
          : { ok: true, opcoes: json.data?.opcoes ?? [] },
    });
  }

  try {
    const { cep_destino, subtotal } = req.body;
    const configs = await getConfigs(req.db);
    const opcoes = await calcularOpcoesFrete({
      cepDestino: cep_destino,
      subtotal: parseFloat(subtotal) || 0,
      configs,
    });
    res.json({ ok: true, opcoes });
  } catch (err) {
    console.error('[Frete] Erro:', err.message);
    res.json({ ok: false, erro: err.message, opcoes: [] });
  }
});

module.exports = router;
