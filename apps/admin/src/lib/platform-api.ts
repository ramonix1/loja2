import type { PlatformTenant } from '@lojao/types/platform';

import { apiFetch } from './api-client';

export type { PlatformTenant };

export function listTenants(): Promise<PlatformTenant[]> {
  return apiFetch<{ data: PlatformTenant[] }>('/api/v1/platform/tenants').then((r) => r.data);
}

export function getTenant(slug: string): Promise<PlatformTenant> {
  return apiFetch<{ data: PlatformTenant }>(`/api/v1/platform/tenants/${slug}`).then((r) => r.data);
}

export function createTenant(input: {
  slug: string;
  nome: string;
  plano?: string;
}): Promise<PlatformTenant> {
  return apiFetch<{ data: PlatformTenant }>('/api/v1/platform/tenants', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.data);
}

export function updateTenant(
  slug: string,
  patch: { nome?: string; ativo?: boolean; plano?: string },
): Promise<PlatformTenant> {
  return apiFetch<{ data: PlatformTenant }>(`/api/v1/platform/tenants/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  }).then((r) => r.data);
}
