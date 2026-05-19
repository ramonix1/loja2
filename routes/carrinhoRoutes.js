const express = require('express');
const router = express.Router();
const carrinho = require('../controllers/carrinhoController');
const { requireAuth } = require('../middlewares/auth');

router.get('/carrinho', requireAuth, carrinho.exibirCarrinho);
router.get('/carrinho/contagem', requireAuth, carrinho.contagem);
router.post('/carrinho/adicionar', requireAuth, carrinho.adicionarItem);
router.post('/carrinho/atualizar/:id', requireAuth, carrinho.atualizarItem);
router.post('/carrinho/remover/:id', requireAuth, carrinho.removerItem);

module.exports = router;
