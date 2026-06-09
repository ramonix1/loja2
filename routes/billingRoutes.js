const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

/**
 * SUPER ADMIN ENDPOINTS
 */

// Listar planos dispon�veis
router.get('/admin/api/billing/plans', billingController.listPlans);

// Atribuir plano a um tenant
router.post('/admin/api/billing/tenants/:tenantId/assign-plan', billingController.assignPlanToTenant);

// Relatório de receita (super admin)
router.get('/admin/api/billing/revenue-report', billingController.getRevenueReport);

// Listar todas as invoices
router.get('/admin/api/billing/invoices', billingController.listAllInvoices);

// Listar configuração de billing de todos tenants
router.get('/admin/api/billing/tenants', billingController.listTenantBillings);

/**
 * CLIENTE ENDPOINTS
 */

// Ver minha configuração de billing
router.get('/api/billing/my-billing', billingController.getMyBilling);

// Ver meu relatório de faturamento
router.get('/api/billing/my-report', billingController.getMyBillingReport);

// Listar minhas invoices
router.get('/api/billing/my-invoices', billingController.listMyInvoices);

// Ver uma invoice espec�fica
router.get('/api/billing/invoices/:invoiceId', billingController.getInvoice);

module.exports = router;
