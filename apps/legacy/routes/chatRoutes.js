const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const ctrl = require('../controllers/chatController');

router.get('/admin/chat', requireAdmin, ctrl.paginaAdmin);
router.get('/admin/chat/api/conversas', requireAdmin, ctrl.listarConversas);
router.get('/admin/chat/api/conversa/:id/mensagens', requireAdmin, ctrl.mensagensConversa);
router.post('/admin/chat/api/bot-respostas', requireAdmin, ctrl.criarBotResposta);
router.put('/admin/chat/api/bot-respostas/:id', requireAdmin, ctrl.atualizarBotResposta);
router.delete('/admin/chat/api/bot-respostas/:id', requireAdmin, ctrl.excluirBotResposta);

module.exports = router;
