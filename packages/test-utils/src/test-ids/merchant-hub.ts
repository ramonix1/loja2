/**
 * data-testid do Merchant Hub (Fase H).
 */
export const merchantHub = {
  page: 'merchant-hub-page',
  storeList: 'merchant-hub-store-list',
  switchStore: 'merchant-hub-switch-link',
  storeCard: (slug: string) => `merchant-hub-store-card-${slug}`,
  selectStore: (slug: string) => `merchant-hub-select-${slug}`,
} as const;
