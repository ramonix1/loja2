const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/masterController');

router.get('/login',  ctrl.loginPage);
router.post('/login', ctrl.login);
router.post('/logout', ctrl.requireMaster, ctrl.logout);

router.get('/', ctrl.requireMaster, ctrl.dashboard);

// Leads
router.post('/leads/gerar-link',    ctrl.requireMaster, ctrl.gerarLink);
router.post('/leads/:id/ativar',    ctrl.requireMaster, ctrl.ativarLead);
router.post('/leads/:id/cancelar',  ctrl.requireMaster, ctrl.cancelarLead);

// Tenants
router.post('/tenants/:slug/toggle', ctrl.requireMaster, ctrl.toggleTenant);
router.post('/tenants/:slug/fee',    ctrl.requireMaster, ctrl.editarFee);

// Config
router.post('/config', ctrl.requireMaster, ctrl.salvarConfig);

module.exports = router;
