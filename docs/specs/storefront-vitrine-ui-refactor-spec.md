# Spec — Refatoração UI da Vitrine (Storefront)

| Campo | Valor |
|-------|-------|
| **Status** | `in_progress` (Onda 7) |
| **Escopo** | `apps/storefront` + `apps/api` (reviews, wishlist) + `packages/db` (migrations tenant) |
| **Referências** | Mockups estilo Shopcart (PDP, grid, carrosséis, checkout) |
| **Princípios** | [`docs/design/UX-PRINCIPLES.md`](../design/UX-PRINCIPLES.md) — mobile-first, touch 48px, vitrine claro fixo |
| **Fora da migração** | Initiative pós-Fase 8; não altera contratos críticos de checkout sem revisão |

---

## 1. Objetivo

Modernizar a vitrine pública para um padrão visual alinhado ao e-commerce atual (2024–2026): hierarquia clara, cards de produto ricos, navegação descobrível, PDP orientada à conversão e fluxo carrinho/checkout com aparência de produto — **sem quebrar** multi-tenant, branding por loja (`cor_primaria`, logo) nem testes E2E existentes.

**Não é objetivo:** copiar pixel-perfect o mockup Shopcart (verde fixo, financing). A identidade continua sendo a **cor da loja** configurada em `/admin/aparencia`.

### Decisões de escopo ampliadas (2026-07-02)

| Feature | Decisão |
|---------|---------|
| **Reviews / ratings** | **In scope — funcional** (persistência, API, UI vitrine; moderação admin mínima) |
| **Wishlist** | **In scope — funcional** (persistência por usuário logado, API, UI card + PDP) |
| **Variantes de produto** | **In scope — mock/stub UI only** (swatches na PDP; **não** altera carrinho, checkout nem schema `produtos`) |

---

## 2. Análise das referências (pontos fortes)

### 2.1 Navegação e descoberta

| Padrão | Por que funciona |
|--------|------------------|
| Barra superior utilitária (promo, contato) | Comunica oferta e confiança sem poluir o header principal |
| Header com logo, categorias, busca central e ícones Conta/Carrinho | Padrão mental universal; reduz cliques para achar produto |
| Busca pill-shaped proeminente | Descoberta rápida em catálogos médios/grandes |
| Filtros horizontais em pills (tipo, preço, cor…) + “Ordenar por” | Escaneável no mobile (scroll horizontal); familiar de marketplaces |
| Breadcrumbs na PDP | Orientação e SEO; substitui “voltar” genérico |
| Grid “Categorias populares” com contagem | Atalho visual para navegação por intenção |

### 2.2 Apresentação de produtos

| Padrão | Por que funciona |
|--------|------------------|
| Imagem em fundo cinza claro (`#f5f5f5` approx), produto “flutuando” | Consistência visual mesmo com fotos amadoras do lojista |
| Card: título + preço na mesma linha | Preço visível no scan do grid |
| Descrição curta (1 linha) abaixo | Contexto sem abrir PDP |
| Estrelas + contagem de reviews | Prova social (quando dados existem) |
| Botão único “Add to Cart” pill outlined → solid no hover | CTA claro; menos competição com “Ver detalhes” |
| Ícone wishlist no canto da imagem | Micro-interação de desejo (secundário) |
| Carrosséis “Similar items” / “Recently viewed” | Aumenta descoberta e recompra |

### 2.3 Página de produto (PDP)

| Padrão | Por que funciona |
|--------|------------------|
| Galeria grande + thumbnails abaixo | Zoom visual; variantes por cor |
| Preço destacado + parcelamento (opcional) | Reduz fricção de preço alto |
| Seletor de quantidade pill (- 1 +) | Controle antes do carrinho |
| Alerta “Low stock” em cor de aviso | Urgência sem ser agressivo |
| Dois CTAs: **Comprar agora** (primário) + **Adicionar ao carrinho** (outline) | Atende compra impulsiva vs. continuar navegando |
| Bloco de confiança: entrega grátis, devolução | Reduz abandono na PDP |
| Seções relacionadas abaixo da dobra | Retém usuário no funil |

### 2.4 Hero e listagem

| Padrão | Por que funciona |
|--------|------------------|
| Hero lifestyle com fundo cream/soft, headline + CTA | Emocional; diferencia de grid “lista de preço” |
| Título de seção (“Headphones For You!”) | Ritmo visual entre hero e grid |
| Grid responsivo 2→4 colunas | Densidade adequada mobile/desktop |

### 2.5 Carrinho e checkout

| Padrão | Por que funciona |
|--------|------------------|
| Lista de itens com thumb + título + preço (não tabela densa) | Mobile-first; legível no celular |
| Sidebar “Order Summary” sticky | Total sempre visível |
| Campo cupom no resumo | Conversão promocional |
| Pagamento em radio cards visuais | Escolha clara de método |
| Formulário em blocos nomeados | Progressão cognitiva |

---

## 3. Diagnóstico da vitrine atual (pontos fracos)

Inventário com base em `apps/storefront/src/**` (mar/2026).

### 3.1 Shell e navegação

| Área | Estado atual | Gap vs. referência |
|------|--------------|-------------------|
| `StoreHeaderNav` | Logo + Home + links auth; menu hamburger mobile | Sem busca, sem links de categoria, sem ícone carrinho com badge, sem barra promo |
| Navegação por categoria | Apenas seções na home (`ProductGrid` por categoria) | Sem página/rota de categoria; sem chips no header |
| Carrinho no header | Só aparece após login, como link texto | Referência: ícone sempre visível + contador |
| Footer `StoreFooter` | Nome, slogan, copyright centralizado | Sem contato, políticas, redes, colunas |

### 3.2 Home

| Área | Estado atual | Gap |
|------|--------------|-----|
| Hero `BannerCarousel` | Carrossel com overlay escuro gradiente | Estilo diferente (referência: hero claro/lifestyle); OK funcionalmente |
| Título da loja | `h1` nome + slogan abaixo do banner | Repete informação do header; ocupa espaço antes dos produtos |
| Grade `ProductGrid` | 1→4 colunas, título por categoria | Sem filtros, ordenação, “ver todos”, carrossel horizontal |
| Empty state | Texto simples | Sem ilustração/CTA para lojista (aceitável) |

### 3.3 Product card (`product-card.tsx`)

| Elemento | Estado atual | Gap |
|----------|--------------|-----|
| Imagem | `aspect-[4/3] object-cover`, borda do card | Sem fundo neutro elevado; crop agressivo |
| Hierarquia | Título → subtítulo → preço empilhados | Preço não alinhado ao título; subtítulo ocupa 2 linhas |
| Social proof | Ausente | Sem rating (API também não expõe) |
| CTAs | Faixa inferior com borda: “Ver detalhes” + “Adicionar” | Dois botões competem; referência usa 1 CTA pill |
| Wishlist | Ausente | — |
| Hover | `shadow-md` no card | Referência: hover no botão, card mais flat |
| Link | Card inteiro linkável + botões separados | Área clicável confusa (nested interactive) |

### 3.4 PDP (`produto/[id]/page.tsx`)

| Elemento | Estado atual | Gap |
|----------|--------------|-----|
| Navegação | Link “← Voltar para loja” | Sem breadcrumbs |
| Galeria `ProductGallery` | Imagem + thumbs — **adequada** | Falta container fundo neutro; altura max fixa 460px |
| Preço | `text-4xl font-black` cor primária | OK; falta contexto parcelamento (opcional futuro) |
| Estoque | Texto simples | Falta destaque visual “últimas unidades” (cor aviso) |
| Quantidade | Sempre 1 via `AddToCartButton` | Sem seletor qty na PDP |
| CTAs | Só “Adicionar ao carrinho” (+ login se anon) | Sem “Comprar agora”; redireciona direto ao carrinho após add |
| Confiança | Ausente | Sem bloco entrega/devolução |
| Relacionados | Ausente | Sem “produtos similares” / mesma categoria |

### 3.5 Carrinho (`cart-view.tsx`)

| Elemento | Estado atual | Gap |
|----------|--------------|-----|
| Layout | `<table>` desktop-first | Ruim no mobile; referência usa cards/lista |
| Resumo | Panel lateral simples | OK estruturalmente; falta cupom, linha frete estimado |
| Quantidade | IconButtons +/- | OK; poderia ser pill compacto |
| Empty state | Texto + CTA | Aceitável; pode enriquecer visual |

### 3.6 Checkout (`checkout-form.tsx`)

| Elemento | Estado atual | Gap |
|----------|--------------|-----|
| Layout | Grid 2+1 colunas | Alinhado à referência em estrutura |
| Visual | Panels genéricos `storePanelClass` | Falta lista compacta de itens no resumo; radios pagamento básicos |
| Cupom | Ausente | Referência inclui (depende de feature backend) |

### 3.7 Design system / tokens

| Aspecto | Estado atual | Gap |
|---------|--------------|-----|
| Botões | `rounded-lg`, `.btn-primary` / `.btn-outline` | Referência usa pills (`rounded-full` ou `rounded-2xl`) |
| Cards | Borda + sombra leve | Referência mais flat, separação por fundo de imagem |
| Tipografia | Títulos bold consistentes | Falta escala para “eyebrow” / preço tabular |
| `--cor-primaria` | CTAs e preço | Correto para multi-tenant |
| Tokens `--store-*` | Definidos em `semantic-store.css` | Falta tokens semânticos para `--store-image-bg`, `--store-warning`, pill radius |

### 3.8 Dados / API (limitações estruturais)

| Feature referência | Disponível hoje |
|--------------------|-----------------|
| Busca pública de produtos | **Não** — só listagem por store/categoria |
| Reviews / ratings | **Não** → **escopo ampliado** (§5.11) |
| Wishlist | **Não** → **escopo ampliado** (§5.12) |
| Variantes (cor/tamanho) | **Mock UI only** (§5.13); schema/carrinho intactos |
| Cupom checkout | Verificar módulo; **não exposto na UI** storefront |
| Contagem carrinho (header) | API cart existe; **não consumida no header** |
| Produtos relacionados | Dados existem (mesma categoria); **não renderizados** |

---

## 4. Direção de design (decisões fechadas para esta spec)

1. **Mobile-first** — layout, filtros e carrinho pensados primeiro para 360–430px.
2. **Branding tenant** — `--cor-primaria` continua sendo a cor de CTA, links ativos, borda de seleção e preço; não hardcodar verde Shopcart.
3. **Vitrine claro fixo** — sem toggle dark (`data-store-theme="claro"`).
4. **Tokens, não hex solto** — novos estilos via `packages/design-tokens` + `store-styles.ts`; respeitar `make check-design`.
5. **Componentes reutilizáveis** — extrair primitivos vitrine em `apps/storefront/src/components/store/` (ou `packages/ui` se compartilhável depois).
6. **Progressive enhancement** — layout e tokens primeiro; reviews/wishlist em onda dedicada com API; variantes mock só no storefront.
7. **Reviews autênticos** — só compradores com pedido **entregue** contendo o produto podem avaliar (1 review por usuário/produto).
8. **Wishlist = usuário logado** — anônimo: toast “Entre para salvar”; sem localStorage como fonte de verdade.
9. **Variantes mock** — dados gerados no client (`variant-mock.ts`); badge discreto “Prévia” até admin de variantes existir; **nunca** enviar `variante_id` ao carrinho nesta fase.

---

## 5. Especificação detalhada — o que modificar e adicionar

### 5.1 Tokens e estilos base

**Arquivos:** `packages/design-tokens/src/semantic-store.css`, `apps/storefront/src/app/globals.css`, `apps/storefront/src/lib/store-styles.ts`

| ID | Mudança | Detalhe |
|----|---------|---------|
| T1 | Novo token `--store-image-bg` | Cinza neutro claro (~`#f3f4f6` ou mix de `--store-border`) para área de foto |
| T2 | Novo token `--store-warning` | Laranja/âmbar para low-stock (não confundir com `--store-error`) |
| T3 | `--store-radius-pill` | `9999px` ou `1.5rem` para busca, filtros, CTAs secundários |
| T4 | `--store-radius-card` | Manter `rounded-xl` (12px) ou subir para `rounded-2xl` (16px) — **decisão:** 16px cards, pill botões |
| T5 | Classe `.btn-pill` | Variante de `.btn-primary` / `.btn-outline` com radius pill |
| T6 | Helper `storePriceClass()` | Preço tabular, peso extrabold, cor primária |
| T7 | Helper `storeImageWellClass()` | Container imagem produto: bg token + padding + aspect-square |

### 5.2 Header (`StoreHeaderNav` + novos subcomponentes)

**Novos componentes sugeridos:**

- `store-top-bar.tsx` (opcional, configurável futuro via admin)
- `store-search-input.tsx`
- `store-category-nav.tsx`
- `store-cart-link.tsx` (badge contagem)

| ID | Mudança | Detalhe |
|----|---------|---------|
| H1 | **Layout desktop** | Logo (esq) · nav categorias · busca flex-1 central · ícones Conta + Carrinho (dir) |
| H2 | **Layout mobile** | Logo · ícone busca (expande overlay ou sheet) · carrinho · hamburger |
| H3 | **Links de categoria** | Anchor `#cat-{id}` na home **ou** rota `/categoria/[id]` (ver §5.4) |
| H4 | **Busca** | Input pill com ícone; debounce 300ms; **Fase A:** filtro client-side na home; **Fase B:** `GET /public/products?q=` |
| H5 | **Carrinho header** | Ícone sempre visível; badge com `fetchCart` count (client); link `/carrinho`; login redirect se 401 |
| H6 | **Sticky header** | `sticky top-0 z-40` + sombra sutil ao scroll |
| H7 | **testids** | `store-header-search`, `store-header-cart`, `store-header-cart-badge`, `store-header-category-{id}` |

**Remover/simplificar:** link “Home” redundante quando logo já leva à home.

### 5.3 Barra promo (opcional — fase 2 UI)

| ID | Mudança | Detalhe |
|----|---------|---------|
| P1 | Faixa acima do header | Texto curto + link; fundo `--cor-primaria` ou tom neutro |
| P2 | Config | **Out of scope backend inicial** — hardcode off ou banner tipo “Frete grátis acima de X” quando lojista configurar (futuro admin) |

### 5.4 Home (`store/[slug]/page.tsx`)

| ID | Mudança | Detalhe |
|----|---------|---------|
| HO1 | **Hero** | Manter `BannerCarousel`; ajustar variante visual “claro”: overlay reduzido ou split layout texto/imagem sem gradiente pesado |
| HO2 | **Título loja** | Reduzir peso visual: mover slogan para header/footer; home começa direto em produtos ou hero |
| HO3 | **Seção categorias** | Novo `CategoryPills` ou grid 2×3 mobile com link scroll/`/categoria/[id]` |
| HO4 | **Barra filtros** | `ProductFiltersBar`: chips scroll horizontal — categoria (client), faixa preço (client), ordenar (nome, preço asc/desc) |
| HO5 | **ProductGrid** | Suportar modo carrossel horizontal opcional por seção (`overflow-x-auto snap`) |
| HO6 | **Título seção** | Padrão referência: `{Categoria} para você` + link “Ver todos” quando > N produtos |
| HO7 | **Rota categoria (nova)** | `app/store/[slug]/categoria/[id]/page.tsx` — SSR mesma API, filtro por categoria |

### 5.5 Product card — refatoração completa

**Arquivo:** `product-card.tsx` (+ possível split `product-card-image.tsx`, `product-card-actions.tsx`)

| ID | Mudança | Detalhe |
|----|---------|---------|
| PC1 | **Estrutura** | Card sem borda pesada; sombra `shadow-sm` ou só border subtle |
| PC2 | **Imagem** | Wrapper `storeImageWellClass`, `aspect-square`, `object-contain`, padding interno |
| PC3 | **Header row** | Flex: título (truncate) + preço (nowrap, direita) |
| PC4 | **Subtítulo** | `line-clamp-1` texto muted |
| PC5 | **Rating** | `<ProductRating />` com `media` + `total` da API pública; oculto se `total === 0` |
| PC6 | **CTA único** | Botão pill outline “Adicionar ao carrinho” full-width; hover/focus solid primário |
| PC7 | **Ver detalhes** | Título da imagem clicável (Link); remover botão “Ver detalhes” |
| PC8 | **Esgotado** | Overlay semi-transparente na imagem + badge “Esgotado”; CTA disabled |
| PC9 | **Wishlist** | Ícone coração canto superior direito; toggle via API; filled quando favoritado; login redirect se 401 |
| PC10 | **A11y** | Evitar button dentro de link; estrutura: link imagem+título, button add separado |
| PC11 | **Add behavior** | **Não** redirecionar automaticamente ao carrinho; toast “Adicionado” + atualizar badge header |

### 5.6 PDP — refatoração completa

**Arquivos:** `produto/[id]/page.tsx`, `product-gallery.tsx`, `product-purchase-actions.tsx`, novos componentes

| ID | Mudança | Detalhe |
|----|---------|---------|
| PD1 | **Breadcrumbs** | `Home / {Categoria?} / {Produto}` — links reais |
| PD2 | **Layout** | Manter 2 colunas lg; gap consistente 8–10 |
| PD3 | **Galeria** | Fundo neutro; thumbs com borda primária ativa (já existe); zoom opcional v2 |
| PD4 | **Rating + reviews** | Média + link “Ver N avaliações”; seção `<ProductReviews />` abaixo da descrição |
| PD4b | **Variantes (mock)** | `<ProductVariantPicker type="color" />` com 2–4 swatches fake; badge “Prévia”; não altera preço/estoque |
| PD5 | **Preço** | `storePriceClass` + subtítulo abaixo |
| PD6 | **Low stock** | Se `estoque <= 5`: texto `--store-warning` “Restam apenas N unidades!” |
| PD7 | **QuantitySelector** | Componente pill `-` `[input]` `+`; min 1, max estoque |
| PD8 | **CTA primário** | “Comprar agora” → add qty + redirect checkout (ou carrinho→checkout) |
| PD9 | **CTA secundário** | “Adicionar ao carrinho” outline pill |
| PD10 | **Trust block** | Card com ícones: “Entrega” (calcular CEP link), “Trocas” (texto configurável footer/admin futuro) |
| PD11 | **Descrição** | Tipografia `prose` limitada; colapsável “Ver mais” se > 4 linhas mobile |
| PD12 | **Produtos relacionados** | Seção abaixo: até 8 produtos mesma categoria (`ProductGrid` carrossel) |
| PD13 | **testids** | `store-product-qty`, `store-product-buy-now`, `store-product-trust`, `store-product-related` |

### 5.7 Carrinho

**Arquivo:** `cart-view.tsx`

| ID | Mudança | Detalhe |
|----|---------|---------|
| C1 | **Substituir table** | Lista de `CartLineItem` cards: thumb, nome, preço unit, qty pill, subtotal, remover |
| C2 | **Mobile** | Stack vertical; resumo em `Sheet` sticky bottom ou accordion “Ver resumo” |
| C3 | **Resumo** | Subtotal, frete estimado (“Calculado no checkout”), total destacado |
| C4 | **Cupom** | Input + botão no resumo — **UI stub** desabilitado até API cupom |
| C5 | **Continuar comprando** | Link secundário acima da lista |

### 5.8 Checkout

**Arquivo:** `checkout-form.tsx`

| ID | Mudança | Detalhe |
|----|---------|---------|
| CH1 | **Resumo sidebar** | Mini-lista itens (thumb + nome + qty + preço) acima dos totais |
| CH2 | **Pagamento** | Radio cards com borda selecionada (PIX, boleto, cartão…) |
| CH3 | **Progress indicator** | Steps opcionais: Carrinho → Entrega → Pagamento (visual leve) |
| CH4 | **Cupom** | Mesmo stub do carrinho se feature existir backend |

### 5.9 Footer

**Arquivo:** `store-footer.tsx`

| ID | Mudança | Detalhe |
|----|---------|---------|
| F1 | **Layout colunas** | Mobile stack: Sobre · Ajuda · Contato |
| F2 | **Conteúdo** | Nome, slogan, WhatsApp/e-mail se configurados (campo admin futuro; placeholder oculto se vazio) |
| F3 | **Links legais** | Política privacidade / trocas — links externos ou `#` até páginas CMS |
| F4 | **Branding Ata** | Linha discreta “Powered by Ata Commerce” (opcional, alinhar naming policy) |

### 5.10 Componentes compartilhados novos (inventário)

| Componente | Responsabilidade |
|------------|------------------|
| `StoreSearchInput` | Busca pill, keyboard a11y |
| `StoreCategoryNav` | Links categorias header |
| `StoreCartBadgeLink` | Ícone + contagem |
| `ProductFiltersBar` | Chips filtro/ordenação client-side |
| `CategoryGrid` | Cards categoria home |
| `QuantitySelector` | - / input / + pill |
| `ProductRating` | Estrelas + count (dados API) |
| `ProductReviews` | Lista + form nova avaliação |
| `WishlistButton` | Toggle coração card/PDP |
| `ProductVariantPicker` | Swatches mock (cor/tamanho) |
| `TrustBadges` | Entrega / devolução |
| `CartLineItem` | Item lista carrinho |
| `OrderSummaryPanel` | Resumo reutilizado carrinho/checkout |
| `ProductCarousel` | Scroll horizontal snap + dots |
| `StoreBreadcrumbs` | Nav hierárquica |
| `AddToCartToast` | Feedback pós-add (sonner ou inline) |

### 5.11 Reviews / ratings — funcional

**Escopo:** API tenant + UI vitrine + moderação admin mínima. **Fora:** importação de reviews externos, fotos em review, resposta do lojista (backlog).

#### 5.11.1 Modelo de dados (migration tenant)

Nova tabela `product_reviews` (nomenclatura EN alinhada a `products` / merchant schema):

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | SERIAL PK | |
| `store_id` | INTEGER NOT NULL | Multi-tenant merchant DB |
| `product_id` | INTEGER NOT NULL FK → `products` | ON DELETE CASCADE |
| `user_id` | INTEGER NOT NULL FK → `users` | Comprador |
| `rating` | SMALLINT NOT NULL | CHECK 1–5 |
| `comment` | TEXT | Opcional; max 1000 chars |
| `status` | VARCHAR(20) DEFAULT `'pending'` | `pending` \| `approved` \| `rejected` |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

Índices: `(store_id, product_id, status)`, UNIQUE `(store_id, product_id, user_id)`.

**Regra de negócio — quem pode avaliar:**

- Usuário autenticado (`role === 'usuario'`)
- Possui pedido com `status IN ('entregue')` contendo o `product_id` em `order_items`
- Ainda não avaliou esse produto (unique constraint)

**Agregados expostos na API pública:**

```typescript
rating_summary: {
  average: number;  // 1 decimal, ex. 4.3
  count: number;    // apenas approved
}
```

Incluir `rating_summary` em:

- `PublicProduct` (lista/card)
- `PublicProductDetail` (PDP)

#### 5.11.2 API (`apps/api`)

Prefixo autenticado + tenant (`storePlugin`):

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/v1/public/products/:id/reviews` | Não | Lista paginada (`page`, `limit`); só `approved`; inclui `nome` parcial do autor |
| `POST` | `/api/v1/products/:id/reviews` | Sim (buyer) | Cria review `pending`; validação Zod |
| `GET` | `/api/v1/admin/reviews` | Admin | Lista pendentes + filtros |
| `PATCH` | `/api/v1/admin/reviews/:id` | Admin | Aprovar/rejeitar |

Respostas padrão `{ data }` / `{ error, code }`.

**Auto-aprovação (decisão MVP):** reviews entram como `approved` imediatamente se lojista não habilitar moderação — campo futuro `store.reviews_moderation_enabled`. **Default desta spec:** `approved` direto (menos fricção para lojas pequenas); admin pode deletar depois.

> **Alternativa conservadora:** default `pending` + tela admin obrigatória. **Decisão fechada:** auto-approve; PATCH admin para rejeitar/remover abusos.

#### 5.11.3 UI vitrine

| ID | Componente / tela | Detalhe |
|----|-------------------|---------|
| RV1 | `ProductRating` | 5 estrelas (fill parcial), `(count)` muted; `data-testid=store-product-rating` |
| RV2 | `ProductReviews` | Lista paginada; estrelas + comentário + data relativa |
| RV3 | `ProductReviewForm` | Só se logado + elegível; estrelas interativas + textarea; erro claro se sem compra entregue |
| RV4 | Card home | Rating compacto abaixo do subtítulo |
| RV5 | PDP | Rating abaixo do título; seção reviews após descrição |
| RV6 | Empty | “Seja o primeiro a avaliar” + CTA form |

#### 5.11.4 Admin (mínimo)

| ID | Tela | Detalhe |
|----|------|---------|
| RA1 | `/admin/avaliacoes` ou tab em produtos | Lista reviews; ação rejeitar/excluir |
| RA2 | Opcional v1 | Pular tela dedicada; exclusão via SQL/support — **preferir** listagem simples |

#### 5.11.5 Tipos

Estender `packages/types/src/public-store.ts`:

- `productRatingSummarySchema`
- `publicProductReviewSchema`
- Campos opcionais `rating_summary` em product schemas

---

### 5.12 Wishlist — funcional

**Escopo:** favoritos por usuário logado, persistidos no tenant DB. **Fora:** wishlist anônima, compartilhar lista, notificação de preço.

#### 5.12.1 Modelo de dados

Tabela `wishlist_items`:

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | SERIAL PK | |
| `store_id` | INTEGER NOT NULL | |
| `user_id` | INTEGER NOT NULL FK → `users` | ON DELETE CASCADE |
| `product_id` | INTEGER NOT NULL FK → `products` | ON DELETE CASCADE |
| `created_at` | TIMESTAMP | |

UNIQUE `(store_id, user_id, product_id)`.

#### 5.12.2 API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/v1/wishlist` | Sim | Lista produtos (`PublicProduct` enxuto) |
| `GET` | `/api/v1/wishlist/ids` | Sim | `{ product_ids: number[] }` — leve para hidratar cards |
| `POST` | `/api/v1/wishlist/:productId` | Sim | Adiciona; idempotente |
| `DELETE` | `/api/v1/wishlist/:productId` | Sim | Remove |
| `GET` | `/api/v1/wishlist/count` | Sim | `{ count }` — badge header opcional |

#### 5.12.3 UI vitrine

| ID | Mudança | Detalhe |
|----|---------|---------|
| WL1 | `WishlistButton` | `IconButton` coração; `aria-pressed`; posição absolute no image well |
| WL2 | Card | Botão não navega; `stopPropagation` |
| WL3 | PDP | Mesmo botão ao lado do título ou sobre galeria |
| WL4 | Anônimo | Click → redirect login com `?redirect=` atual + toast |
| WL5 | Página `/favoritos` | Grid de produtos favoritos; link no menu usuário |
| WL6 | Header | Ícone coração + badge count (logado) — paridade com carrinho |
| WL7 | Hidratação | Client fetch `wishlist/ids` uma vez no layout ou provider |
| WL8 | testids | `store-wishlist-btn-{productId}`, `store-wishlist-page`, `store-header-wishlist-badge` |

#### 5.12.4 Tipos

`packages/types/src/wishlist.ts` — schemas Zod request/response.

---

### 5.13 Variantes de produto — mock / stub (UI only)

**Objetivo:** reproduzir UX das referências (swatches de cor) **sem** migration, admin nem impacto no carrinho.

#### 5.13.1 Fonte de dados mock

Arquivo `apps/storefront/src/lib/product-variant-mock.ts`:

```typescript
export type MockVariant = {
  id: string;
  label: string;
  colorHex?: string;
  imageUrl?: string; // opcional: troca thumb galeria
};

export function getMockVariants(productId: number, productName: string): MockVariant[];
```

**Regras do gerador:**

- Retorna `[]` se produto não elegível (ex.: flag env `NEXT_PUBLIC_VARIANT_MOCK=0`)
- Caso contrário, 2–4 variantes determinísticas via hash de `productId` (mesmas cores sempre)
- Paleta fixa de swatches neutros + `--cor-primaria` como uma opção
- **Nunca** persistir seleção no servidor

#### 5.13.2 UI

| ID | Componente | Detalhe |
|----|------------|---------|
| V1 | `ProductVariantPicker` | Label “Cor” ou “Opção”; swatches circulares; borda primária no ativo |
| V2 | Badge | Texto “Prévia” / `aria-description` “Seleção demonstrativa; não altera o pedido” |
| V3 | Galeria | Ao selecionar variante com `imageUrl`, trocar imagem principal (opcional; pode reusar mesma foto) |
| V4 | Preço / estoque | **Inalterados** — não recalcular |
| V5 | Carrinho / checkout | Ignorar variante; `addToCart(produtoId, qty)` sem campo extra |
| V6 | Card grid | **Não** mostrar swatches no card (só PDP) |

#### 5.13.3 Evolução futura (documentar, não implementar)

Quando variantes reais existirem:

- Tabela `product_variants` + admin CRUD
- Substituir `product-variant-mock.ts` por campo API `variantes[]`
- Migrar picker para dados reais; remover badge “Prévia”
- Carrinho passa a referenciar `variant_id` — **breaking change** em fase própria

#### 5.13.4 testids

- `store-product-variant-picker`
- `store-product-variant-{mockId}`

---

## 6. API / backend — dependências por fase

### Fase UI-only (sem mudança API)

- Layout header/footer/cards/PDP/carrinho
- Breadcrumbs (dados já em store + product)
- Produtos relacionados (filtrar `categorias[].produtos` client/SSR)
- Filtro e ordenação client-side na home
- Quantity na PDP (já suportado `addToCart(produtoId, qty)` — verificar assinatura)
- Badge carrinho (`GET` cart count endpoint ou length itens)
- Low stock styling
- **Variantes mock** (§5.13) — 100% storefront

### Fase API — reviews + wishlist (escopo ampliado)

| Entrega | Arquivos / notas |
|---------|------------------|
| Migration `0006_product_reviews_wishlist.sql` (merchant) | Tabelas §5.11.1 + §5.12.1 |
| Drizzle schema | `packages/db/src/schema/merchant/` |
| Módulo `reviews` | `apps/api/src/modules/reviews/` |
| Módulo `wishlist` | `apps/api/src/modules/wishlist/` |
| Admin reviews (mínimo) | `apps/admin/src/routes/admin/avaliacoes/` |
| Tipos | `packages/types` |
| Testes integração | `apps/api/tests/integration/reviews.test.ts`, `wishlist.test.ts` |
| Enriquecer `public.service` | JOIN agregado rating em listagens |

### Fase API leve (restante)

| Endpoint / mudança | Para |
|--------------------|------|
| `GET /public/products?q=&sort=&categoria_id=` | Busca e filtros server-side |
| `GET /cart/summary` ou campo `item_count` | Badge header performance |
| Campos loja: `whatsapp`, `email_contato`, `politica_trocas` | Footer + trust block |

### Backlog pós-refatoração

| Feature | Notas |
|---------|-------|
| Variantes reais | Schema + admin + carrinho |
| Moderação reviews obrigatória | Flag loja |
| Cupom | Integrar checkout existente se houver |
| Parcelamento | Gateway ou regra fixa lojista |
| Review com foto | Storage + moderação |

---

## 7. Plano de implementação sugerido

| Onda | Entrega | Esforço |
|------|---------|---------|
| **1 — Fundação visual** | Tokens T1–T7, `.btn-pill`, `storeImageWellClass`, product card PC1–PC8 (sem rating/wishlist ainda) | 2–3 d |
| **2 — Header + carrinho** | H1–H7, add-to-cart toast, badge, fix redirect PC11 | 2–3 d |
| **3 — Home** | HO1–HO6, filtros client HO4, category pills HO3 | 2–3 d |
| **4 — PDP base** | PD1–PD3, PD5–PD13, QuantitySelector, dual CTA, **VariantPicker mock V1–V6** | 3–4 d |
| **5 — Reviews + wishlist (API)** | Migration, módulos API, tipos, testes integração, rating em public products | 3–4 d |
| **6 — Reviews + wishlist (UI)** | RV1–RV6, WL1–WL8, PC5/PC9, PD4, página `/favoritos`, admin RA1 | 3–4 d |
| **7 — Carrinho/checkout** | C1–C5, CH1–CH3 | 2–3 d |
| **8 — Footer + polish** | F1–F4, hero variant HO1, carrossel relacionados | 1–2 d |
| **9 — API busca** | HO4 Fase B, rota categoria HO7 | 2 d |

**Total estimado:** 21–28 dias dev + 3–4 dias QA E2E.

---

## 8. Testes e qualidade

### 8.1 data-testid (atualizar catálogo)

Adicionar em `packages/test-utils/src/test-ids/store.ts` e `docs/migration/test-ids-catalog.md`:

- `store-header-search`
- `store-header-cart-badge`
- `store-product-qty-input`
- `store-product-buy-now-btn`
- `store-cart-line-item-{id}`
- `store-filters-sort`
- `store-category-pill-{id}`
- `store-product-rating`
- `store-product-reviews`
- `store-product-review-form`
- `store-product-review-submit`
- `store-wishlist-btn-{productId}`
- `store-wishlist-page`
- `store-header-wishlist-badge`
- `store-product-variant-picker`
- `store-product-variant-{mockId}`

**Manter** testids existentes compatíveis; deprecar só se elemento remover.

### 8.2 Playwright

Atualizar / expandir:

- `apps/e2e/tests/store/vitrine.spec.ts` — card layout, breadcrumb PDP, rating visible
- `apps/e2e/tests/store/cart.spec.ts` — lista mobile, qty
- **`apps/e2e/tests/store/wishlist.spec.ts`** — add/remove, login gate
- **`apps/e2e/tests/store/reviews.spec.ts`** — listagem pública; submit (seed pedido entregue)
- Novo smoke: busca client-side filtra grid
- **`apps/e2e/tests/store/variants-mock.spec.ts`** — picker visível na PDP; badge “Prévia”

### 8.3 Critérios visuais (DoD)

- [ ] Lighthouse mobile Performance ≥ 85 na home (sem regressão > 5pts)
- [ ] Touch targets ≥ 44px em CTAs e qty
- [ ] Contraste WCAG AA em texto sobre `--store-image-bg`
- [ ] `make check-design` passa
- [ ] `pnpm turbo typecheck` passa
- [ ] Branding: trocar `cor_primaria` reflete em CTAs, preço, seleção
- [ ] Reviews: usuário sem pedido entregue recebe 403 ao POST
- [ ] Wishlist: toggle idempotente; count correto no header
- [ ] Variantes mock não alteram payload do carrinho (assert E2E network)
- [ ] Zero regressão checkout `@smoke`

---

## 9. Fora de escopo (v1)

- Dark mode vitrine
- **Variantes reais** (schema, admin, carrinho) — apenas mock UI (§5.13)
- Financing / parcelamento dinâmico
- Página CMS políticas (links placeholder OK)
- Reescrita admin aparência (campos footer/promo bar)
- Internacionalização
- Wishlist anônima (localStorage)
- Reviews de usuários sem compra entregue
- Fotos em reviews / resposta do lojista

---

## 10. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Fotos lojistas irregulares | `object-contain` + fundo neutro |
| Catálogo grande + filtro client | Limitar a Fase B server-side |
| Nested interactive no card | Separar link e button (PC10) |
| Checkout regression | E2E smoke obrigatório antes merge |
| Reviews spam | Unique user/product; opcional rate limit POST |
| Wishlist + cart confusion | Ícones distintos; labels a11y claros |
| Variante mock confunde comprador | Badge “Prévia” + aria-description obrigatórios |
| Scope creep variantes reais | Gate explícito: nenhum `variant_id` na API cart |
| Migration tenant | Testar em merchant DB seed; rollback documentado |

---

## 11. Referência cruzada de arquivos atuais

| Arquivo | Ação |
|---------|------|
| `components/product-card.tsx` | Refatorar |
| `components/product-grid.tsx` | Estender (carrossel, ver todos) |
| `components/layout/store-header-nav.tsx` | Refatorar |
| `components/layout/store-nav.tsx` | Integrar ícones header |
| `components/layout/store-footer.tsx` | Refatorar |
| `components/banner-carousel.tsx` | Variante visual |
| `components/product-gallery.tsx` | Estilizar well |
| `components/product-purchase-actions.tsx` | Qty + dual CTA |
| `components/add-to-cart-button.tsx` | Qty param, toast, no auto-redirect |
| `components/cart-view.tsx` | Lista mobile |
| `components/checkout-form.tsx` | Resumo itens |
| `lib/store-styles.ts` | Novos helpers |
| `app/globals.css` | btn-pill |
| `packages/design-tokens/src/semantic-store.css` | Novos tokens |
| `packages/db/drizzle/merchant/0001_*.sql` | Reviews + wishlist |
| `packages/types/src/public-store.ts` | `rating_summary` |
| `packages/types/src/wishlist.ts` | Novo |
| `packages/types/src/reviews.ts` | Novo |
| `apps/api/src/modules/reviews/` | Novo |
| `apps/api/src/modules/wishlist/` | Novo |
| `apps/storefront/src/lib/product-variant-mock.ts` | Novo |
| `apps/storefront/src/components/product-variant-picker.tsx` | Novo |
| `apps/storefront/src/components/product-reviews.tsx` | Novo |
| `apps/storefront/src/components/wishlist-button.tsx` | Novo |
| `apps/storefront/src/app/store/[slug]/favoritos/page.tsx` | Novo |
| `apps/admin/src/routes/admin/avaliacoes/` | Novo (mínimo) |

---

## 12. Changelog

| Data | Autor | Mudança |
|------|-------|---------|
| 2026-07-02 | Spec inicial | Análise referências Shopcart vs vitrine atual; escopo ondas 1–7 |
| 2026-07-02 | Onda 4 entregue | PDP breadcrumbs, qty, dual CTA, trust, relacionados, variantes mock |
| 2026-07-02 | Onda 3 entregue | Hero light, CategoryGrid, ProductFiltersBar, carrossel, títulos seção |
| 2026-07-02 | Onda 2 entregue | Header sticky, busca, categorias, badge carrinho, toast add-to-cart, PC11 |
| 2026-07-02 | Onda 1 entregue | Tokens, btn-pill, ProductCard refatorado (PC1–PC8) |
| 2026-07-02 | Escopo ampliado | Reviews + wishlist funcionais; variantes mock UI; ondas 5–6 API/UI social; §5.11–5.13 |
