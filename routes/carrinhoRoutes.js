const express = require('express');
const router = express.Router();
const carrinho = require('../controllers/carrinhoController');
const { requireAuth } = require('../middlewares/auth');
const { apiLimiter } = require('../middlewares/rateLimiter');

router.get('/carrinho', requireAuth, carrinho.exibirCarrinho);
router.get('/carrinho/contagem', requireAuth, carrinho.contagem);
router.post('/carrinho/adicionar', requireAuth, apiLimiter, carrinho.adicionarItem);
router.post('/carrinho/atualizar/:id', requireAuth, apiLimiter, carrinho.atualizarItem);
router.post('/carrinho/remover/:id', requireAuth, apiLimiter, carrinho.removerItem);

module.exports = router;
