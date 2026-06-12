const express = require('express');
const router = express.Router();
const carrinho = require('../controllers/carrinhoController');
const { requireAuth } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');
const { isNewCart, proxyToApi } = require('../utils/newApiProxy');

router.get('/carrinho', requireAuth, carrinho.exibirCarrinho);
router.get('/carrinho/contagem', requireAuth, async (req, res) => {
  if (isNewCart()) {
    return proxyToApi(req, res, '/api/v1/cart/count', {
      legacyJsonShape: (json) => ({ contagem: json.data?.contagem ?? 0 }),
    });
  }
  return carrinho.contagem(req, res);
});
router.post('/carrinho/adicionar', requireAuth, apiLimiter, async (req, res) => {
  if (isNewCart()) {
    return proxyToApi(req, res, '/api/v1/cart/items', {
      body: {
        produto_id: Number(req.body.produto_id),
        quantidade: Number(req.body.quantidade) || 1,
      },
      legacyJsonShape: (json, status) =>
        status >= 400
          ? { erro: json.error || 'Erro ao adicionar.' }
          : { sucesso: true, contagem: json.data?.contagem ?? 0 },
    });
  }
  return carrinho.adicionarItem(req, res);
});
router.post('/carrinho/atualizar/:id', requireAuth, apiLimiter, async (req, res) => {
  if (isNewCart()) {
    return proxyToApi(req, res, `/api/v1/cart/items/${req.params.id}`, {
      method: 'PATCH',
      body: { quantidade: Number(req.body.quantidade) },
      legacyJsonShape: (json, status) =>
        status >= 400
          ? { erro: json.error || 'Erro.' }
          : {
              sucesso: true,
              contagem: json.data?.contagem ?? 0,
              total: json.data?.total ?? '0.00',
            },
    });
  }
  return carrinho.atualizarItem(req, res);
});
router.post('/carrinho/remover/:id', requireAuth, apiLimiter, async (req, res) => {
  if (isNewCart()) {
    return proxyToApi(req, res, `/api/v1/cart/items/${req.params.id}`, {
      method: 'DELETE',
      legacyJsonShape: (json, status) =>
        status >= 400
          ? { erro: json.error || 'Erro.' }
          : {
              sucesso: true,
              contagem: json.data?.contagem ?? 0,
              total: json.data?.total ?? '0.00',
            },
    });
  }
  return carrinho.removerItem(req, res);
});

module.exports = router;
