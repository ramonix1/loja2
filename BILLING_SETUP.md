# 🚀 Setup Modelo Híbrido de Faturamento

## ✅ O Que Foi Criado

### Banco de Dados (4 novas tabelas)
- ✅ `billing_plans` - Planos disponíveis
- ✅ `tenant_billing` - Config de billing por cliente
- ✅ `invoices` - Faturas mensais
- ✅ `commission_transactions` - Log de comissões

### Backend (3 novos serviços)
- ✅ `services/billingService.js` - Lógica de billing
- ✅ `controllers/billingController.js` - APIs
- ✅ `routes/billingRoutes.js` - Rotas

### Scripts
- ✅ `scripts/migrations-billing.js` - Criar tabelas
- ✅ `scripts/seed-billing.js` - Popular planos
- ✅ `scripts/generate-invoices.js` - Gerar invoices mensais

### Documentação
- ✅ `BILLING_INTEGRATION.md` - Guia completo de integração

---

## 🏃 Quick Start (5 passos)

### 1. Rodar Migrations
```bash
node scripts/migrations-billing.js up
```

**Esperado:** ✅ 3 migrations concluídas

### 2. Popular Planos Padrão
```bash
node scripts/seed-billing.js
```

**Esperado:** ✅ 4 planos criados (Básico, Profissional, Enterprise, Premium Híbrido)

### 3. Integrar Rotas no Server
Abrir `server.js` e adicionar ANTES de `app.listen()`:

```javascript
// Billing routes
const billingRoutes = require('./routes/billingRoutes');
app.use(billingRoutes);
```

### 4. Integrar BillingService no Checkout
Abrir `controllers/checkoutController.js` e:

**A. Adicionar import (já feito):**
```javascript
const BillingService = require('../services/billingService');
```

**B. Após pedido estar 'pago', registrar comissão:**

Encontre onde o status do pedido muda para 'pago' e adicione:

```javascript
// Após: await db.query("UPDATE pedidos SET status = 'pago', ...");

// Registrar comissão (se cliente tem billing com comissão)
try {
  await BillingService.recordCommissionOnOrder(
    req.session.tenant_id,
    pedidoId,
    total  // valor total do pedido
  );
} catch (err) {
  console.error('⚠️ Erro ao registrar comissão:', err.message);
  // Não interrompe checkout se comissão falhar
}
```

### 5. Testar APIs

```bash
# Ver planos
curl http://localhost:3000/admin/api/billing/plans | jq

# Ver seu billing (como cliente)
curl http://localhost:3000/api/billing/my-billing | jq
```

---

## 📊 Planos Disponíveis

| Plano | Preço | Tipo | Detalhe |
|-------|-------|------|---------|
| **Básico** | R$ 99,90/mês | Fixed | Catálogo + Pedidos |
| **Profissional** | R$ 199,90/mês | Fixed | + Clientes + Relatórios |
| **Enterprise** | 2% por venda | Revenue Share | Sem mensalidade |
| **Premium Híbrido** | R$ 99,90 + 1% | Hybrid | Mensalidade + comissão |

---

## 💰 Exemplo de Receita (100 clientes)

### Cenário Realista:
```
60 clientes Profissional:   60 × R$ 199,90 = R$ 11.994/mês
30 clientes Enterprise:     ~R$ 15k vendas × 2% = R$ 9.000/mês
10 clientes Híbrido:        (10 × R$ 99,90) + (R$ 12k × 1%) = R$ 2.099/mês

TOTAL: ~R$ 23.093/mês = R$ 277k/ano
```

---

## 🔧 Próximos Passos (Opcional)

### 1. Configurar Cron para Gerar Invoices
No `server.js`, adicionar:

```javascript
const cron = require('node-cron');

// Todo 1º do mês às 00:30
cron.schedule('30 0 1 * *', async () => {
  console.log('⏰ Gerando invoices...');
  const { execSync } = require('child_process');
  execSync('node scripts/generate-invoices.js');
});
```

**Instalar:** `npm install node-cron`

### 2. Enviar Email com Fatura
Em `services/emailService.js`, criar função:

```javascript
async function enviarFatura(tenantEmail, invoiceData) {
  const html = `
    <h2>Fatura de ${invoiceData.month_year}</h2>
    <p>Valor: R$ ${invoiceData.total.toFixed(2)}</p>
    <p>Vencimento: ${invoiceData.due_date}</p>
  `;
  
  await nodemailer.sendMail({
    to: tenantEmail,
    subject: `Fatura ${invoiceData.invoice_number}`,
    html
  });
}
```

### 3. Dashboard de Billing para Cliente
Criar página `/billing` com:
- Plano atual
- Próxima data de cobrança
- Últimas invoices
- Relatório de vendas/comissões

---

## 📋 Checklist de Integração

```
Banco de Dados:
  ☐ Rodar migrations
  ☐ Rodar seed
  ☐ Testar: SELECT * FROM billing_plans;

Backend:
  ☐ Integrar rotas no server.js
  ☐ Integrar BillingService no checkout
  ☐ Testar APIs com curl

Clientes Existentes:
  ☐ Decidir qual plano atribuir a cada um
  ☐ Executar: POST /admin/api/billing/tenants/{id}/assign-plan

Automação:
  ☐ Configurar cron job para gerar invoices
  ☐ Configurar email com fatura (opcional)

Documentação:
  ☐ Documentar para clientes qual plano contrataram
  ☐ Criar FAQ sobre faturamento
```

---

## 🆘 Troubleshooting

### Erro: "table does not exist"
```bash
# Solução:
node scripts/migrations-billing.js up
```

### Erro: "Plano não encontrado"
```bash
# Solução:
node scripts/seed-billing.js
```

### Comissão não está sendo registrada
- Verificar: `SELECT * FROM commission_transactions;`
- Verificar: Cliente tem `tenant_billing` com `commission_percentage > 0`?
- Verificar: BillingService.recordCommissionOnOrder foi chamado?

### Invoice não foi gerada
```bash
# Gerar manualmente:
node scripts/generate-invoices.js 2026-05
```

---

## 📞 Suporte Técnico

Para cada cliente, você pode:

1. **Ver dados de billing:**
   ```bash
   curl http://localhost:3000/admin/api/billing/tenants | jq '.[] | select(.tenant_name | contains("Sapataria"))'
   ```

2. **Ver invoices geradas:**
   ```bash
   curl http://localhost:3000/admin/api/billing/invoices?monthYear=2026-05
   ```

3. **Ver receita total:**
   ```bash
   curl http://localhost:3000/admin/api/billing/revenue-report?monthYear=2026-05 | jq '.revenue'
   ```

---

## 💡 Exemplos de Negociação

### Cliente com pouquíssimas vendas:
> "Recomendo Revenue Share (2% só de vendas). Você só paga quando vender!"

### Cliente com vendas consistentes:
> "Profissional a R$ 199,90/mês sai mais em conta. E temos suporte prioritário"

### Cliente quer máxima flexibilidade:
> "Premium Híbrido: R$ 99,90 fixo + 1% por venda. Se vender muito, negocia desconto!"

---

## ✨ Próximas Releases

- [ ] v1.1: Webhook de pagamento para atualizar invoice status
- [ ] v1.2: Desconto para clientes com muitos pedidos
- [ ] v1.3: Planos customizados (A-la-carte de features)
- [ ] v1.4: Integração com gateway de débito automático
- [ ] v1.5: Portál do cliente com analytics de faturamento
