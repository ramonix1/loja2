/**
 * data-testid da vitrine Next (Fase 5+) e fluxo comprador (Fase 6).
 */
export const store = {
  slugLayout: 'store-slug-layout',
  header: 'store-header',
  homeProductGrid: 'store-home-product-grid',
  homeProductCard: (id: number | string): string => `store-home-product-card-${id}`,
  homeBannerCarousel: 'store-home-banner-carousel',
  productDetail: 'store-product-detail',
  productGallery: 'store-product-gallery',
  productGalleryThumb: (id: number | string): string => `store-product-gallery-thumb-${id}`,
  productTitle: 'store-product-title',
  productPrice: 'store-product-price',
  productAddCartBtn: 'store-product-add-cart-btn',
  cartTable: 'store-cart-table',
  cartItemRow: (id: number | string): string => `store-cart-item-row-${id}`,
  cartCheckoutBtn: 'store-cart-checkout-btn',
  /** Link carrinho na nav da vitrine (I5). */
  navCart: 'store-nav-cart',
  /** Botão menu mobile no header da vitrine (I5). */
  headerMenu: 'store-header-menu',
  checkoutForm: 'store-checkout-form',
  checkoutPayment: (metodo: string): string => `store-checkout-payment-${metodo}`,
  checkoutPaymentTeste: 'store-checkout-payment-teste',
  checkoutSubmitBtn: 'store-checkout-submit-btn',
  checkoutSuccessMsg: 'store-checkout-success-msg',
  ordersTable: 'store-orders-table',
  orderRow: (id: number | string): string => `store-order-row-${id}`,
} as const;
