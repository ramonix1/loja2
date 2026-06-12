const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const { adminRedirect } = require('../utils/adminRedirect');

// Fase 3: UI admin migrada para React — redirect 302 (sem data-testid no EJS).
router.get('/admin/categorias', requireAdmin, adminRedirect('/admin/categorias'));
router.get('/admin/categorias/:id/editar', requireAdmin, (req, res) => {
  res.redirect(302, `${(process.env.ADMIN_URL || 'http://localhost:5173').replace(/\/$/, '')}/admin/categorias/${req.params.id}`);
});
router.post('/admin/categorias', requireAdmin, adminRedirect('/admin/categorias'));
router.post('/admin/categorias/:id', requireAdmin, (req, res) => {
  res.redirect(302, `${(process.env.ADMIN_URL || 'http://localhost:5173').replace(/\/$/, '')}/admin/categorias/${req.params.id}`);
});
router.post('/admin/categorias/:id/remover', requireAdmin, adminRedirect('/admin/categorias'));

module.exports = router;
