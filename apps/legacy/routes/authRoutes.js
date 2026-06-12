const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { requireGuest, requireAdmin } = require('../middlewares/auth');
const { loginLimiter, recuperacaoLimiter } = require('../middlewares/rateLimiter');
const { adminRedirect } = require('../utils/adminRedirect');

router.get('/login', requireGuest, auth.exibirLogin);
router.post('/login', requireGuest, loginLimiter, auth.processarLogin);
router.post('/logout', auth.logout);

router.get('/cadastro', requireGuest, auth.exibirCadastro);
router.post('/cadastro', requireGuest, auth.processarCadastro);

router.get('/recuperar-senha', requireGuest, auth.exibirRecuperarSenha);
router.post('/recuperar-senha', requireGuest, recuperacaoLimiter, auth.processarRecuperarSenha);

router.get('/redefinir-senha/:token', auth.exibirRedefinirSenha);
router.post('/redefinir-senha/:token', auth.processarRedefinirSenha);

router.get('/admin/permissoes', requireAdmin, adminRedirect('/admin/permissoes'));
router.post('/admin/permissoes/criar', requireAdmin, adminRedirect('/admin/permissoes'));
router.post('/admin/permissoes/toggle/:id', requireAdmin, adminRedirect('/admin/permissoes'));
router.post('/admin/permissoes/excluir/:id', requireAdmin, adminRedirect('/admin/permissoes'));

module.exports = router;
