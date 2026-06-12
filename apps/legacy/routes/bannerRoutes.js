const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const { adminRedirect } = require('../utils/adminRedirect');

const adminBase = (process.env.ADMIN_URL || 'http://localhost:5173').replace(/\/$/, '');

// Fase 3: UI admin migrada para React — redirect 302 (sem data-testid no EJS).
router.get('/admin/banners', requireAdmin, adminRedirect('/admin/banners'));
router.get('/admin/banners/novo', requireAdmin, adminRedirect('/admin/banners/novo'));
router.get('/admin/banners/editar/:id', requireAdmin, (req, res) => {
  res.redirect(302, `${adminBase}/admin/banners/${req.params.id}`);
});
router.post('/admin/banners/salvar', requireAdmin, adminRedirect('/admin/banners'));
router.post('/admin/banners/atualizar/:id', requireAdmin, (req, res) => {
  res.redirect(302, `${adminBase}/admin/banners/${req.params.id}`);
});
router.get('/admin/banners/excluir/:id', requireAdmin, adminRedirect('/admin/banners'));
router.post('/admin/banners/toggle/:id', requireAdmin, adminRedirect('/admin/banners'));

module.exports = router;
