'use client';

import { useEffect, useState } from 'react';

import { API_URL, TENANT_SLUG } from '@/lib/config';

interface BillingConfig {
  billing_type?: string;
  plan_name?: string;
  monthly_fee?: number;
}

export function BillingDashboard() {
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/billing/config`, {
      credentials: 'include',
      headers: { 'X-Tenant-Slug': TENANT_SLUG },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Não foi possível carregar billing.');
        const json = await res.json();
        setConfig(json.data);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!config) return <p className="text-gray-500">Carregando…</p>;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold">Plano da loja</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Tipo</dt>
          <dd className="font-medium">{config.billing_type ?? '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Plano</dt>
          <dd className="font-medium">{config.plan_name ?? '—'}</dd>
        </div>
        {config.monthly_fee != null ? (
          <div className="flex justify-between">
            <dt className="text-gray-500">Mensalidade</dt>
            <dd className="font-medium">R$ {Number(config.monthly_fee).toFixed(2)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
