const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const config = require('../controllers/configController');

router.get('/admin/configuracoes', requireAdmin, config.exibirConfiguracoes);
router.post('/admin/configuracoes', requireAdmin, config.salvarConfiguracoes);

module.exports = router;
