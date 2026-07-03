import type { DashboardPeriodo } from '@lojao/types/dashboard';
import type {
  PlatformDashboardStats,
  PlatformHealthSummary,
  PlatformMerchantListItem,
  PlatformReportsSummary,
  PlatformStore,
  PlatformStoreBilling,
  PlatformStoreDetail,
  PlatformStoreListItem,
  PlatformStoreMetrics,
} from '@lojao/types/platform';
import type { PlatformDashboardChartsData } from '@lojao/types';
import type { ApiMeta } from '@lojao/types';

import { apiFetch } from './api-client';

export type {
  PlatformStore,
  PlatformStoreDetail,
  PlatformDashboardStats,
  PlatformStoreListItem,
  PlatformMerchantListItem,
  PlatformStoreMetrics,
  PlatformStoreBilling,
  PlatformHealthSummary,
  PlatformReportsSummary,
};

export function listPlatformStores(): Promise<PlatformStore[]> {
  return apiFetch<{ data: PlatformStore[] }>('/api/v1/platform/stores').then((r) => r.data);
}

export type ListPlatformStoresParams = {
  q?: string;
  status?: 'active' | 'suspended';
  plano?: string;
  page?: number;
  limit?: number;
};

export type ListPlatformStoresResponse = {
  items: PlatformStoreListItem[];
  meta: ApiMeta;
};

export function listPlatformStoresPaginated(
  params: ListPlatformStoresParams = {},
): Promise<ListPlatformStoresResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.plano) search.set('plano', params.plano);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<{ data: PlatformStoreListItem[]; meta: ApiMeta }>(
    `/api/v1/platform/stores${qs ? `?${qs}` : ''}`,
  ).then((r) => ({ items: r.data, meta: r.meta ?? { page: 1, perPage: 20, total: r.data.length } }));
}

export type ListPlatformMerchantsParams = {
  q?: string;
  status?: 'active' | 'suspended';
  page?: number;
  limit?: number;
};

export type ListPlatformMerchantsResponse = {
  items: PlatformMerchantListItem[];
  meta: ApiMeta;
};

export function listPlatformMerchantsPaginated(
  params: ListPlatformMerchantsParams = {},
): Promise<ListPlatformMerchantsResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<{ data: PlatformMerchantListItem[]; meta: ApiMeta }>(
    `/api/v1/platform/merchants${qs ? `?${qs}` : ''}`,
  ).then((r) => ({ items: r.data, meta: r.meta ?? { page: 1, perPage: 20, total: r.data.length } }));
}

export function getPlatformDashboardStats(): Promise<PlatformDashboardStats> {
  return apiFetch<{ data: PlatformDashboardStats }>('/api/v1/platform/dashboard/stats').then(
    (r) => r.data,
  );
}

export function getPlatformDashboardCharts(
  periodo: DashboardPeriodo = '30d',
): Promise<PlatformDashboardChartsData> {
  return apiFetch<{ data: PlatformDashboardChartsData }>(
    `/api/v1/platform/dashboard/charts?periodo=${periodo}`,
  ).then((r) => r.data);
}

export function getPlatformStore(slug: string): Promise<PlatformStoreDetail> {
  return apiFetch<{ data: PlatformStoreDetail }>(`/api/v1/platform/stores/${slug}`).then(
    (r) => r.data,
  );
}

export function getPlatformStoreMetrics(slug: string): Promise<PlatformStoreMetrics> {
  return apiFetch<{ data: PlatformStoreMetrics }>(`/api/v1/platform/stores/${slug}/metrics`).then(
    (r) => r.data,
  );
}

export function getPlatformStoreBilling(slug: string): Promise<PlatformStoreBilling> {
  return apiFetch<{ data: PlatformStoreBilling }>(`/api/v1/platform/stores/${slug}/billing`).then(
    (r) => r.data,
  );
}

export function getPlatformHealthSummary(): Promise<PlatformHealthSummary> {
  return apiFetch<{ data: PlatformHealthSummary }>('/api/v1/platform/health').then((r) => r.data);
}

export function getPlatformReportsSummary(): Promise<PlatformReportsSummary> {
  return apiFetch<{ data: PlatformReportsSummary }>('/api/v1/platform/reports').then((r) => r.data);
}

export function createPlatformStore(input: {
  slug: string;
  nome: string;
  plano?: string;
}): Promise<PlatformStore> {
  return apiFetch<{ data: PlatformStore }>('/api/v1/platform/stores', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);
}

export function updatePlatformStore(
  slug: string,
  patch: { nome?: string; ativo?: boolean; plano?: string },
): Promise<PlatformStore> {
  return apiFetch<{ data: PlatformStore }>(`/api/v1/platform/stores/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  }).then((r) => r.data);
}

export function impersonatePlatformStore(slug: string): Promise<{
  adminUrl: string;
  store: { slug: string; nome: string };
}> {
  return apiFetch<{
    data: { adminUrl: string; store: { slug: string; nome: string } };
  }>(`/api/v1/platform/stores/${slug}/impersonate`, {
    method: 'POST',
    body: JSON.stringify({}),
  }).then((r) => r.data);
}

export function endPlatformImpersonation(): Promise<void> {
  return apiFetch('/api/v1/platform/end-impersonation', {
    method: 'POST',
    body: JSON.stringify({}),
  }).then(() => undefined);
}
