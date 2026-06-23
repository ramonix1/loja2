/**
 * data-testid das páginas marketing (storefront M1–M6).
 */
export const marketing = {
  header: 'marketing-header',
  headerNav: 'marketing-header-nav',
  footer: 'marketing-footer',
  landingHero: 'landing-hero',
  /** CTA primário do hero — aponta para /pricing (protótipo v2) */
  landingHeroCtaPricing: 'landing-hero-cta-pricing',
  /** @deprecated usar landingHeroCtaPricing */
  landingHeroCtaPlanos: 'landing-hero-cta-pricing',
  /** @deprecated usar landingHeroCtaPricing */
  landingHeroCtaCommerce: 'landing-hero-cta-pricing',
  landingStats: 'landing-stats',
  landingContactForm: 'landing-contact-form',
  ataCommerceHero: 'ata-commerce-hero',
  ataCommerceFeatures: 'ata-commerce-features',
  ataCommerceFaq: 'ata-commerce-faq',
  pricingPage: 'pricing-page',
  /** @deprecated usar pricingPage */
  planosPage: 'pricing-page',
  pricingGrid: 'pricing-grid',
  /** @deprecated usar pricingGrid */
  planosGrid: 'pricing-grid',
  pricingCard: (slug: string): string => `pricing-card-${slug}`,
  /** @deprecated usar pricingCard */
  planosCard: (slug: string): string => `pricing-card-${slug}`,
  pricingComparisonTable: 'pricing-comparison-table',
  /** @deprecated usar pricingComparisonTable */
  planosComparisonTable: 'pricing-comparison-table',
  demoPage: 'demo-page',
  demoOpenStoreLink: 'demo-open-store-link',
} as const;
