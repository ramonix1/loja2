const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

/**
 * SUPER ADMIN ENDPOINTS
 */

// Listar planos disponÃveis
router.get('/admin/api/billing/plans', billingController.listPlans);

// Atribuir plano a um tenant
router.post('/admin/api/billing/tenants/:tenantId/assign-plan', billingController.assignPlanToTenant);

// RelatÃ³rio de receita (super admin)
router.get('/admin/api/billing/revenue-report', billingController.getRevenueReport);

// Listar todas as invoices
router.get('/admin/api/billing/invoices', billingController.listAllInvoices);

// Listar configuraÃ§Ã£o de billing de todos tenants
router.get('/admin/api/billing/tenants', billingController.listTenantBillings);

/**
 * CLIENTE ENDPOINTS
 */

// Ver minha configuraÃ§Ã£o de billing
router.get('/api/billing/my-billing', billingController.getMyBilling);

// Ver meu relatÃ³rio de faturamento
router.get('/api/billing/my-report', billingController.getMyBillingReport);

// Listar minhas invoices
router.get('/api/billing/my-invoices', billingController.listMyInvoices);

// Ver uma invoice especÃfica
router.get('/api/billing/invoices/:invoiceId', billingController.getInvoice);

module.exports = router;
