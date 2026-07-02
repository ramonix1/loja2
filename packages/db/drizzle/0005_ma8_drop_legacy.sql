-- MA8 — Cutover greenfield: remove schema legado PT do master DB.
-- Pré-requisito: reset ou ambiente novo; dados legados não são migrados.
-- Tabelas merchant (MA1–MA7) e `sessao` permanecem intactas.

-- Billing tenant (substituído por merchant_billing / merchant_invoices / merchant_commission_transactions)
DROP TABLE IF EXISTS commission_transactions CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS tenant_billing CASCADE;

-- Master tenant registry (substituído por merchants + stores)
DROP TABLE IF EXISTS tenants CASCADE;

-- Tabelas de negócio PT no master (dados agora vivem no merchant DB `atacommerce_*`)
DROP TABLE IF EXISTS mensagens CASCADE;
DROP TABLE IF EXISTS conversas CASCADE;
DROP TABLE IF EXISTS bot_respostas CASCADE;
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS agenda_dias_especiais CASCADE;
DROP TABLE IF EXISTS agenda_config CASCADE;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS pedido_itens CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS carrinho_itens CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS produtos_imagens CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS movimentacoes_estoque CASCADE;
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS configuracoes CASCADE;
DROP TABLE IF EXISTS tokens_recuperacao CASCADE;
DROP TABLE IF EXISTS tentativas_login CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
