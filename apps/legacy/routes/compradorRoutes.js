const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const { adminRedirect } = require('../utils/adminRedirect');

router.get('/admin/compradores', requireAdmin, adminRedirect('/admin/compradores'));
router.get('/admin/compradores/:id', requireAdmin, (req, res) => {
  res.redirect(302, `${(process.env.ADMIN_URL || 'http://localhost:5173').replace(/\/$/, '')}/admin/compradores/${req.params.id}`);
});

module.exports = router;
