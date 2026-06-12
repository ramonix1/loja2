const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const { adminRedirect } = require('../utils/adminRedirect');

router.get('/admin/relatorios', requireAdmin, (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const path = qs ? `/admin/relatorios?${qs}` : '/admin/relatorios';
  adminRedirect(path)(req, res);
});

router.get('/admin/relatorios/csv/:tipo', requireAdmin, (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const path = qs
    ? `/admin/relatorios?aba=${req.params.tipo}&${qs}`
    : `/admin/relatorios?aba=${req.params.tipo}`;
  adminRedirect(path)(req, res);
});

module.exports = router;
