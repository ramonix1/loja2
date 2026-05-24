const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { requireAdmin } = require('../middlewares/auth');

router.get('/admin/relatorios', requireAdmin, relatorioController.index);
router.get('/admin/relatorios/csv/:tipo', requireAdmin, relatorioController.exportarCsv);

module.exports = router;
