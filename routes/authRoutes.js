const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { requireGuest } = require('../middlewares/auth');
const { loginLimiter, recuperacaoLimiter } = require('../middlewares/rateLimiter');

router.get('/login', requireGuest, auth.exibirLogin);
router.post('/login', requireGuest, loginLimiter, auth.processarLogin);
router.post('/logout', auth.logout);

router.get('/recuperar-senha', requireGuest, auth.exibirRecuperarSenha);
router.post('/recuperar-senha', requireGuest, recuperacaoLimiter, auth.processarRecuperarSenha);

router.get('/redefinir-senha/:token', auth.exibirRedefinirSenha);
router.post('/redefinir-senha/:token', auth.processarRedefinirSenha);

module.exports = router;
