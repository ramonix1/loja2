# Schema PostgreSQL — nomenclatura em inglês (MA)

| Campo | Valor |
|-------|-------|
| **Initiative ID** | `merchant-account` (MA1 + MA2) |
| **Spec version** | 1.0 |
| **Última atualização** | 2026-07-01 |
| **Status** | `active` — aplicável **somente** ao schema greenfield MA |

---

## 1. Decisão

Todo o banco **novo** (master + merchant DB) usa **inglês** para:

- Nomes de **tabelas**
- Nomes de **colunas**
- Chaves em tabelas key-value (`store_settings.key`)
- **Enums / status** persistidos (ex.: `awaiting_payment`, não `aguardando_pagamento`)

**UI e API pública** continuam em **pt-BR** para o usuário final. Tradução na camada app (DTOs, labels), não no schema.

**Escopo:** greenfield MA — **não** renomear tabelas legadas (`produtos`, `sessao`, …) até o cutover; no cutover o schema legado é **descartado**.

---

## 2. Convenções

| Regra | Exemplo |
|-------|---------|
| Tabelas | `snake_case`, **plural** | `products`, `order_items` |
| Colunas | `snake_case` | `created_at`, `store_id` |
| PK | `id` (serial/uuid) | — |
| FK | `{entity}_id` | `merchant_id`, `product_id` |
| Timestamps | `created_at`, `updated_at` | sempre |
| Booleanos | `is_*` ou adjetivo claro | `active`, `is_read` |
| Drizzle TS | `camelCase` no código → coluna `snake_case` | `passwordHash` → `password_hash` |
| Índices | `idx_{table}_{columns}` | `idx_orders_store_id_status` |

### Valores de domínio (persistidos em inglês)

| Legado (PT) | Novo (EN) |
|-------------|-----------|
| `aguardando_pagamento` | `awaiting_payment` |
| `pago` | `paid` |
| `enviado` | `shipped` |
| `cancelado` | `cancelled` |
| `pendente` | `pending` |
| `usuario` / `admin` (role comprador) | `buyer` / `admin` (member role no master) |
| `aberta` / `encerrada` (chat) | `open` / `closed` |

Campos **só Brasil** mantêm sigla universal: `cpf`, `cep` (coluna), endereço pode ser `street`, `city`, `state` (UF).

---

## 3. Master DB — tabelas novas (MA1)

| Legado / conceito | Tabela nova | Notas |
|-------------------|-------------|-------|
| `tenants` | **`merchants`** | Conta Ata Commerce |
| — | **`stores`** | Loja (vitrine); FK `merchant_id` |
| `usuarios` admin | **`merchant_members`** | Só master; sem admin no merchant DB |
| `sessao` | **`sessions`** | Cookie compat: ver MA4 (colunas `sid`, `sess`, `expire` podem permanecer por lib express-session ou renomear com adapter) |
| `tenant_billing` | **`merchant_billing`** | FK `merchant_id` |
| `billing_plans` | **`billing_plans`** | já EN — manter |
| `invoices` | **`invoices`** | já EN; `tenant_id` → `merchant_id` |
| `commission_transactions` | **`commission_transactions`** | `pedido_id` → `order_id` |
| `platform_config` | **`platform_settings`** | `chave`/`valor` → `key`/`value` |
| `leads` | **`leads`** | renomear colunas PT → EN (ver §3.1) |
| `webhook_events` | **`webhook_events`** | já EN |

### 3.1 Colunas master (exemplos)

**`merchants`**

| Coluna | Tipo | Legado |
|--------|------|--------|
| `id` | serial PK | — |
| `slug` | varchar(50) UNIQUE | `tenants.slug` |
| `name` | varchar(150) | `tenants.nome` |
| `active` | boolean | `tenants.ativo` |
| `db_name` | varchar(100) | `tenants.db_name` |
| `db_host` | varchar(100) | — |
| `db_port` | integer | — |
| `db_user` | varchar(100) | — |
| `db_password` | varchar(100) | — |
| `max_stores` | integer (MA6) | — (limite de lojas do plano; ver merchant-account-architecture-spec.md §2.4) |
| `created_at` | timestamp | — |

**`stores`**

| Coluna | Tipo |
|--------|------|
| `id` | serial PK |
| `merchant_id` | FK → merchants |
| `slug` | varchar(50) UNIQUE (global vitrine) |
| `name` | varchar(100) |
| `active` | boolean |
| `created_at` | timestamp |

**`merchant_members`**

| Coluna | Tipo | Legado |
|--------|------|--------|
| `id` | serial PK | — |
| `merchant_id` | FK | — |
| `email` | varchar(255) | — |
| `name` | varchar(255) | `nome` |
| `password_hash` | text | `senha_hash` |
| `role` | varchar(20) | `owner` \| `admin` \| `operator` |
| `active` | boolean | `ativo` |
| `created_at` | timestamp | — |

**`sessions`** (alvo; MA4 valida compat connect-pg-simple)

| Coluna | Tipo |
|--------|------|
| `sid` | varchar PK |
| `sess` | jsonb |
| `expire` | timestamp |

---

## 4. Merchant DB — mapeamento completo (MA2)

Todas as tabelas incluem **`store_id`** NOT NULL (exceto tabelas globais do merchant, se houver).

| Legado (PT) | Novo (EN) |
|-------------|-----------|
| `usuarios` | **`buyers`** (compradores; `store_id`) |
| `tentativas_login` | **`login_attempts`** (master recomendado) |
| `tokens_recuperacao` | **`password_reset_tokens`** |
| `categorias` | **`categories`** |
| `produtos` | **`products`** |
| `produtos_imagens` | **`product_images`** |
| `configuracoes` | **`store_settings`** (`key`, `value`, `store_id`) |
| `banners` | **`banners`** (nome já EN) |
| `pedidos` | **`orders`** |
| `pedido_itens` | **`order_items`** |
| `pagamentos` | **`payments`** |
| `carrinho_itens` | **`cart_items`** |
| `clientes` (showcase logos) | **`showcase_clients`** ou remover se descontinuado |
| `auditoria` | **`audit_log`** |
| `movimentacoes_estoque` | **`inventory_movements`** |
| `agenda_config` | **`schedule_config`** |
| `agenda_dias_especiais` | **`schedule_special_days`** |
| `agendamentos` | **`appointments`** |
| `conversas` | **`chat_conversations`** |
| `mensagens` | **`chat_messages`** |
| `bot_respostas` | **`chat_bot_replies`** |
| `webhook_events` | **`webhook_events`** (se duplicado no merchant DB) |

### 4.1 Colunas por domínio (amostra)

**`products`**

| Novo | Legado |
|------|--------|
| `store_id` | — (novo) |
| `name` | `nome` |
| `subtitle` | `subtitulo` |
| `price` | `valor` |
| `description` | `descricao` |
| `stock` | `estoque` |
| `category_id` | `categoria_id` |

**`orders`**

| Novo | Legado |
|------|--------|
| `store_id` | — |
| `buyer_id` | `usuario_id` |
| `shipping_name` | `nome_entrega` |
| `shipping_email` | `email_entrega` |
| `shipping_phone` | `telefone_entrega` |
| `shipping_cpf` | `cpf_entrega` |
| `shipping_postal_code` | `cep` |
| `shipping_street` | `logradouro` |
| `shipping_number` | `numero` |
| `shipping_complement` | `complemento` |
| `shipping_district` | `bairro` |
| `shipping_city` | `cidade` |
| `shipping_state` | `estado` |
| `shipping_fee` | `frete` |
| `payment_method` | `metodo_pagamento` |
| `tracking_code` | `codigo_rastreio` |
| `shipping_service` | `frete_servico` |
| `event_date` | `data_evento` |

**`store_settings`** (ex-`configuracoes`)

| Key legado | Key nova |
|------------|----------|
| `loja_nome` | `store.display_name` |
| `loja_slogan` | `store.tagline` |
| `loja_logo` | `store.logo_url` |
| `loja_cor_primaria` | `store.primary_color` |
| `loja_tema` | *(removido — ver dark-theme spec)* |
| `controla_estoque` | `inventory.enabled` |
| `frete_*` | `shipping.*` (namespaced keys EN) |

---

## 5. Implementação Drizzle

```
packages/db/src/schema/
  master/          # merchants, stores, merchant_members, sessions, billing…
  merchant/        # products, orders, … (ex-tenant, inglês)
```

- Baseline MA: **`0001_merchant_account_baseline.sql`** (novo journal; não alterar `0000_baseline.sql` legado).
- Após cutover MA8: remover schema/drizzle legado PT.

---

## 6. Checklist MA1/MA2

- [ ] Nenhuma tabela/coluna nova em português
- [ ] Mapeamento legado→EN documentado neste arquivo (atualizar se add tabela)
- [ ] Services/API: DTOs pt-BR na borda; SQL só identificadores EN
- [ ] Testes seed usam tabelas EN
- [ ] Catálogo OpenAPI: propriedades JSON podem permanecer pt-BR **ou** migrar para EN na API v2 — **decisão MA4** (recomendado: JSON EN + i18n UI)

---

## 7. Referências

- [merchant-account-architecture-spec.md](./merchant-account-architecture-spec.md)
- [naming-policy.md](./naming-policy.md)
