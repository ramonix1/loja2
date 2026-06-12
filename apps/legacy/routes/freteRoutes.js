const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { getConfigs } = require('../controllers/configController');
const { calcularOpcoesFrete } = require('../services/freteService');

router.post('/frete/calcular', requireAuth, async (req, res) => {
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
