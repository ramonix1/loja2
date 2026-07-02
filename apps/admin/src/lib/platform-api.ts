import type { PlatformStore } from '@lojao/types/platform';

import { apiFetch } from './api-client';

export type { PlatformStore };

export function listPlatformStores(): Promise<PlatformStore[]> {
  return apiFetch<{ data: PlatformStore[] }>('/api/v1/platform/stores').then((r) => r.data);
}

export function getPlatformStore(slug: string): Promise<PlatformStore> {
  return apiFetch<{ data: PlatformStore }>(`/api/v1/platform/stores/${slug}`).then((r) => r.data);
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
