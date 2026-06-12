const express = require('express');
const router = express.Router();
const cat = require('../controllers/categoriaController');
const { requireAdmin } = require('../middlewares/auth');

router.get('/admin/categorias', requireAdmin, cat.listar);
router.post('/admin/categorias', requireAdmin, cat.criar);
router.get('/admin/categorias/:id/editar', requireAdmin, cat.exibirEditar);
router.post('/admin/categorias/:id', requireAdmin, cat.atualizar);
router.post('/admin/categorias/:id/remover', requireAdmin, cat.remover);

module.exports = router;
