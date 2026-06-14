/**
 * data-testid da vitrine Next (Fase 5+) e fluxo comprador (Fase 6).
 */
export const store = {
  header: 'store-header',
  homeProductGrid: 'store-home-product-grid',
  homeProductCard: (id: number | string): string => `store-home-product-card-${id}`,
  homeBannerCarousel: 'store-home-banner-carousel',
  productDetail: 'store-product-detail',
  productTitle: 'store-product-title',
  productPrice: 'store-product-price',
  productAddCartBtn: 'store-product-add-cart-btn',
  cartTable: 'store-cart-table',
  cartItemRow: (id: number | string): string => `store-cart-item-row-${id}`,
  cartCheckoutBtn: 'store-cart-checkout-btn',
  checkoutForm: 'store-checkout-form',
  checkoutPayment: (metodo: string): string => `store-checkout-payment-${metodo}`,
  checkoutPaymentTeste: 'store-checkout-payment-teste',
  checkoutSubmitBtn: 'store-checkout-submit-btn',
  checkoutSuccessMsg: 'store-checkout-success-msg',
  ordersTable: 'store-orders-table',
  orderRow: (id: number | string): string => `store-order-row-${id}`,
} as const;
