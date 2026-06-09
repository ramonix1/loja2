const express = require('express');
const router = express.Router();
const agenda = require('../controllers/agendaController');
const { requireAdmin, requireAuth } = require('../middlewares/auth');

// Admin
router.get('/admin/agenda', requireAdmin, agenda.exibirAgenda);
router.post('/admin/agenda/config', requireAdmin, agenda.salvarConfig);
router.post('/admin/agenda/dia', requireAdmin, agenda.salvarDia);
router.post('/admin/agenda/dia/:data/remover', requireAdmin, agenda.removerDia);

// API p√∫blica (usada pelo JS do checkout Ä requer login)
router.get('/api/agenda/disponibilidade', requireAuth, agenda.disponibilidadeMes);
router.get('/api/agenda/verificar', requireAuth, agenda.verificarDisponibilidade);

module.exports = router;
