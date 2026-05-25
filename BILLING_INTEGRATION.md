# 💰 Integração do Sistema de Billing Híbrido

## Overview

O sistema de billing está integrado nos seguintes pontos:

### 1. **Quando um pedido é confirmado (pago)**
```javascript
// Em checkoutController.js, após pedido estar 'pago':

// Registrar comissão automáticamente
BillingService.recordCommissionOnOrder(
  req.session.tenant_id,  // tenant_id do cliente
  pedidoId,               // ID do pedido
  total                   // Valor total do pedido
);
```

### 2. **Ao criar novo cliente (tenant)**
```javascript
// Em authController.js ou onde cria novo cliente:

// Atribuir plano padrão
await BillingService.assignPlanToTenant(
  tenantId,      // ID do novo tenant
  'basico'       // slug do plano (basico, profissional, enterprise-revenue, premium-hybrid)
);
```

### 3. **Gerar invoices (executar 1x por mês)**
```bash
# Via cron job ou manualmente no 1º dia do mês:
node scripts/generate-invoices.js
```

---

## 📋 Tabelas de Banco

### `billing_plans`
Armazena os planos disponíveis:
- **basico**: R$ 99,90/mês (Catálogo + Pedidos)
- **profissional**: R$ 199,90/mês (+ Clientes + Relatórios)
- **enterprise-revenue**: 2% de comissão (sem mensalidade)
- **premium-hybrid**: R$ 99,90/mês + 1% de comissão

### `tenant_billing`
Configuração de billing por cliente:
```
tenant_id → qual cliente
plan_id → qual plano
billing_type → 'fixed', 'revenue_share', ou 'hybrid'
monthly_fee → R$ por mês (se fixed/hybrid)
commission_percentage → % de comissão (se revenue_share/hybrid)
```

### `commission_transactions`
Log de cada comissão gerada:
```
tenant_id → qual cliente
pedido_id → qual pedido gerou a comissão
order_total → R$ do pedido
commission_percentage → %
commission_amount → R$ calculado
month_year → '2026-05'
status → 'pending' → 'invoiced' → 'paid'
```

### `invoices`
Fatura mensal consolidada:
```
tenant_id → qual cliente
invoice_number → INV-2026-05-ABC123
month_year → '2026-05'
billing_type → tipo de billing (fixed/revenue_share/hybrid)
monthly_fee → R$ se fixed/hybrid
total_sales → soma de vendas se revenue_share
commission_amount → R$ de comissão
total → valor final da fatura
status → 'pending', 'sent', 'paid', 'overdue'
due_date → data de vencimento
```

---

## 🚀 Setup Inicial

### 1. Rodar Migrations
```bash
node scripts/migrations-billing.js up
```

### 2. Rodar Seed (Popular Planos)
```bash
node scripts/seed-billing.js
```

### 3. Integrar Rotas no server.js
```javascript
const billingRoutes = require('./routes/billingRoutes');
app.use(billingRoutes);
```

### 4. Integrar BillingService no Checkout

No `checkoutController.js`, após pedido estar 'pago', adicione:

```javascript
// Registrar comissão (se cliente tem billing com comissão)
try {
  await BillingService.recordCommissionOnOrder(
    req.session.tenant_id,
    pedidoId,
    total  // valor total do pedido
  );
} catch (err) {
  console.error('⚠️ Erro ao registrar comissão:', err.message);
  // Não falha checkout se comissão falhar
}
```

---

## 📊 APIs Disponíveis

### Super Admin (Você)

**GET** `/admin/api/billing/plans`
- Lista todos os planos disponíveis

**POST** `/admin/api/billing/tenants/:tenantId/assign-plan`
- Atribuir plano a um cliente
```json
{ "planSlug": "profissional" }
```

**GET** `/admin/api/billing/revenue-report?monthYear=2026-05`
- Relatório de receita total do mês

**GET** `/admin/api/billing/invoices?monthYear=2026-05&status=pending`
- Listar todas as invoices

**GET** `/admin/api/billing/tenants`
- Listar config de billing de todos clientes

### Cliente (Seu Cliente)

**GET** `/api/billing/my-billing`
- Ver seu plano e configuração

**GET** `/api/billing/my-report?monthYear=2026-05`
- Ver relatório de faturamento do mês
```json
{
  "billingType": "hybrid",
  "monthlyFee": 99.90,
  "commissionPercentage": 1.0,
  "orders": {
    "total": 125,
    "totalSales": 15000.00,
    "totalCommission": 150.00
  }
}
```

**GET** `/api/billing/my-invoices`
- Listar suas invoices do ano

**GET** `/api/billing/invoices/:invoiceId`
- Ver detalhes de uma invoice (com list of comissões)

---

## 💡 Exemplos de Uso

### Exemplo 1: Novo Cliente com Plano Básico
```javascript
const BillingService = require('./services/billingService');

// Ao criar novo cliente
const newTenant = { id: 'ten_abc123', name: 'Loja XYZ' };

// Atribuir plano básico
await BillingService.assignPlanToTenant(newTenant.id, 'basico');
// Agora cliente paga R$ 99,90/mês, sem comissão
```

### Exemplo 2: Cliente Faz Compra (Registrar Comissão)
```javascript
// Em checkoutController.js, após pagamento bem-sucedido
const total = 500.00; // valor do pedido

await BillingService.recordCommissionOnOrder(
  req.session.tenant_id,
  pedidoId,
  total
);

// Se cliente tem comissão (revenue_share ou hybrid):
// - Registra: 500 × 2% = R$ 10 de comissão
// - Status: 'pending' até gerar invoice mensal
```

### Exemplo 3: Gerar Invoice Mensal
```javascript
// Executar 1x por mês (1º dia do mês, 00:30)
// node scripts/generate-invoices.js

const BillingService = require('./services/billingService');
const monthYear = '2026-05';

// Gerar invoice para cada tenant
const allTenants = await db.query('SELECT id FROM tenants WHERE status = "active"');
for (const tenant of allTenants.rows) {
  await BillingService.generateMonthlyInvoice(tenant.id, monthYear);
}
```

### Exemplo 4: Ver Receita Total do Mês
```javascript
const report = await BillingService.getRevenueReport('2026-05');

console.log(report);
// {
//   month: '2026-05',
//   activeTenants: 45,
//   revenue: {
//     fixed: 4500.00,      // (R$ 99,90 × 45 clientes)
//     commission: 2300.00, // (comissões de vendas)
//     hybrid: 1500.00,     // (mensal + comissão)
//     total: 8300.00
//   },
//   invoices: {
//     paid: 20,
//     pending: 25
//   }
// }
```

---

## ⚙️ Configuração do Cron (Gerar Invoices Automaticamente)

### Option 1: Usando node-cron
```bash
npm install node-cron
```

No `server.js`:
```javascript
const cron = require('node-cron');
const { generateMonthlyInvoices } = require('./scripts/generate-invoices');

// Executar todo 1º dia do mês às 00:30
cron.schedule('30 0 1 * *', async () => {
  console.log('⏰ Gerando invoices mensais...');
  await generateMonthlyInvoices();
});
```

### Option 2: Usando agenda do seu servidor (ex: cPanel)
```bash
# Executar a cada 1º do mês
0 0 1 * * cd /home/user/loja_3 && node scripts/generate-invoices.js >> /var/log/invoices.log 2>&1
```

---

## 🎯 Fluxo Completo

```
1. Cliente se registra
   ↓
   [billing] Atribuir plano (ex: Básico R$ 99,90/mês)

2. Cliente faz compras
   ↓
   [checkout] Registrar comissão (se aplicável)

3. Fim do mês (1º dia)
   ↓
   [cron] Gerar invoices mensais

4. Invoice gerada
   ↓
   [email] Enviar fatura ao cliente
   ↓
   [dashboard] Cliente vê invoice em /api/billing/my-invoices

5. Cliente paga
   ↓
   [billing] Marcar como 'paid'
   ↓
   [report] Aparecer em receita do super admin
```

---

## 🔍 Testes

### Testar via cURL

```bash
# 1. Ver planos
curl http://localhost:3000/admin/api/billing/plans

# 2. Atribuir plano a cliente
curl -X POST http://localhost:3000/admin/api/billing/tenants/ten_abc/assign-plan \
  -H "Content-Type: application/json" \
  -d '{"planSlug": "profissional"}'

# 3. Ver meu billing (como cliente)
curl http://localhost:3000/api/billing/my-billing

# 4. Ver meu relatório
curl http://localhost:3000/api/billing/my-report?monthYear=2026-05

# 5. Ver receita (como super admin)
curl http://localhost:3000/admin/api/billing/revenue-report?monthYear=2026-05
```

---

## 📝 To-Do

- [ ] Integrar BillingService no checkoutController (registrar comissão)
- [ ] Criar script `generate-invoices.js` para executar mensalmente
- [ ] Adicionar rota de callback para webhook de pagamento
- [ ] Dashboard de billing para cliente (frontend)
- [ ] Dashboard de receita para super admin (frontend)
- [ ] Email com fatura mensal
- [ ] Sistema de reembolso (storno de comissão)
- [ ] Relatório de cobrança atrasada
- [ ] Integração com gateway de pagamento (débito automático)

