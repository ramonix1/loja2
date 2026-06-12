const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/onboardingController');

router.get('/',              ctrl.landing);
router.get('/cadastro',      ctrl.cadastro);
router.get('/sucesso',       ctrl.sucesso);
router.get('/pagamento',     ctrl.pagamento);
router.get('/status',        ctrl.status);
router.get('/:token',        ctrl.cadastro);

router.post('/cadastro',     ctrl.salvarCadastro);
router.post('/webhook',      ctrl.webhook);

module.exports = router;
