const express = require('express');
const router = express.Router();
const agenda = require('../controllers/agendaController');
const { requireAdmin, requireAuth } = require('../middlewares/auth');
const { adminRedirect } = require('../utils/adminRedirect');

router.get('/admin/agenda', requireAdmin, (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  const path = qs ? `/admin/agenda?${qs}` : '/admin/agenda';
  adminRedirect(path)(req, res);
});
router.post('/admin/agenda/config', requireAdmin, adminRedirect('/admin/agenda'));
router.post('/admin/agenda/dia', requireAdmin, adminRedirect('/admin/agenda'));
router.post('/admin/agenda/dia/:data/remover', requireAdmin, adminRedirect('/admin/agenda'));

// API pública (usada pelo JS do checkout — permanece no legacy até Fase 4)
router.get('/api/agenda/disponibilidade', requireAuth, agenda.disponibilidadeMes);
router.get('/api/agenda/verificar', requireAuth, agenda.verificarDisponibilidade);

module.exports = router;
