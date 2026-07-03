# Status — Refatoração UI Vitrine

> Initiative pós-migração. Spec: [`storefront-vitrine-ui-refactor-spec.md`](./storefront-vitrine-ui-refactor-spec.md)

## Onda atual

| Campo | Valor |
|-------|-------|
| **Onda** | 7 — Carrinho/checkout |
| **Status** | `pending` |
| **Iniciada em** | — |

## Progresso por onda

| Onda | Entrega | Status | Data |
|------|---------|--------|------|
| 1 | Tokens T1–T7, `.btn-pill`, product card PC1–PC8 | `done` | 2026-07-02 |
| 2 | Header + carrinho (H1–H7, toast, badge, PC11) | `done` | 2026-07-02 |
| 3 | Home (HO1–HO6, filtros, category pills) | `done` | 2026-07-02 |
| 4 | PDP base (PD1–PD13, variantes mock) | `done` | 2026-07-02 |
| 5 | Reviews + wishlist (API) | `done` | 2026-07-02 |
| 6 | Reviews + wishlist (UI) | `done` | 2026-07-02 |
| 7 | Carrinho/checkout | `pending` | — |
| 8 | Footer + polish | `pending` | — |
| 9 | API busca | `pending` | — |

## Log de entrega

### 2026-07-02 — Onda 6

- `ProductRating`, `ProductReviews`, `ProductReviewForm` (RV1–RV6)
- `WishlistButton`, `StoreWishlistProvider`, badge header, página `/favoritos` (WL1–WL8)
- Card + PDP integrados; rating em listagens quando `rating_summary` existe
- Admin `/admin/avaliacoes` — listagem + rejeitar (RA1)
- testids + E2E `wishlist.spec.ts`, `reviews.spec.ts`

### 2026-07-02 — Onda 5

- Migration merchant `0001_product_reviews_wishlist` — tabelas `product_reviews`, `wishlist_items`
- Tipos `@lojao/types/reviews` e `@lojao/types/wishlist`; `rating_summary` em `PublicProduct`
- API: reviews (POST buyer, GET público, admin list/patch), wishlist CRUD + ids/count
- `requireBuyer` em auth-guard; rotas registradas em `v1.ts`
- `public.service` enriquece listagens com `rating_summary`
- Seed: pedido `delivered` + `order_items.product_id`; cleanup reviews/wishlist
- Testes integração `reviews.test.ts`, `wishlist.test.ts`

### 2026-07-02 — Onda 4

- `StoreBreadcrumbs` — Home / Categoria / Produto (PD1)
- `ProductGallery` — image well neutro, object-contain (PD3)
- `QuantitySelector` pill + dual CTA: Comprar agora → checkout, Adicionar outline (PD7–PD9)
- `storePriceClass`, low stock `--store-warning`, descrição colapsável mobile (PD5–PD6, PD11)
- `TrustBadges` entrega/trocas (PD10)
- Produtos similares — até 8 mesma categoria, carrossel (PD12)
- `product-variant-mock.ts` + `ProductVariantPicker` com badge Prévia (PD4b, V1–V6)
- testids PDP + E2E `variants-mock.spec.ts`, `vitrine.spec.ts` qty

### 2026-07-02 — Onda 3

- `BannerCarousel` variante `light`; home sem título/slogan redundante
- `CategoryGrid`, `ProductFiltersBar`, carrossel seções + Ver todos

### 2026-07-02 — Onda 2

- Header sticky, busca, badge carrinho, toast add-to-cart

### 2026-07-02 — Onda 1

- Tokens, product card refatorado
