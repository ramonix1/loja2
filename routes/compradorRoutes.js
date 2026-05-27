const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const ctrl = require('../controllers/compradorController');

router.get('/admin/compradores', requireAdmin, ctrl.listar);
router.get('/admin/compradores/:id', requireAdmin, ctrl.detalhe);

module.exports = router;
