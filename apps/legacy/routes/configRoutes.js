const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const config = require('../controllers/configController');
const { adminRedirect } = require('../utils/adminRedirect');

router.get('/admin/configuracoes', requireAdmin, adminRedirect('/admin/configuracoes'));
router.post('/admin/configuracoes', requireAdmin, adminRedirect('/admin/configuracoes'));
router.get('/admin/diagnostico', requireAdmin, adminRedirect('/admin/diagnostico'));

module.exports = router;
