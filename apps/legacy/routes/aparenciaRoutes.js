const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const { adminRedirect } = require('../utils/adminRedirect');

// Fase 3: UI admin migrada para React — redirect 302 (sem data-testid no EJS).
router.get('/admin/aparencia', requireAdmin, adminRedirect('/admin/aparencia'));
router.post('/admin/aparencia', requireAdmin, adminRedirect('/admin/aparencia'));

module.exports = router;
