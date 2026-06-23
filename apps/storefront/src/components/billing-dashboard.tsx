'use client';

import { useEffect, useState } from 'react';

import { browserApiBase } from '@/lib/config';
import { getClientTenantSlug } from '@/lib/client-api';
import {
  storeBodyClass,
  storeErrorTextClass,
  storeHeadingClass,
  storeMutedClass,
  storePanelClass,
  storeSubtleClass,
} from '@/lib/store-styles';

interface BillingConfig {
  billing_type?: string;
  plan_name?: string;
  monthly_fee?: number;
}

export function BillingDashboard() {
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${browserApiBase()}/api/v1/billing/config`, {
      credentials: 'include',
      headers: { 'X-Tenant-Slug': getClientTenantSlug() },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Não foi possível carregar billing.');
        const json = await res.json();
        setConfig(json.data);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className={storeErrorTextClass()}>{error}</p>;
  if (!config) return <p className={storeMutedClass()}>Carregando…</p>;

  return (
    <div className={storePanelClass()}>
      <h2 className={storeHeadingClass()}>Plano da loja</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className={storeSubtleClass()}>Tipo</dt>
          <dd className={storeBodyClass('font-medium')}>{config.billing_type ?? '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className={storeSubtleClass()}>Plano</dt>
          <dd className={storeBodyClass('font-medium')}>{config.plan_name ?? '—'}</dd>
        </div>
        {config.monthly_fee != null ? (
          <div className="flex justify-between">
            <dt className={storeSubtleClass()}>Mensalidade</dt>
            <dd className={storeBodyClass('font-medium')}>R$ {Number(config.monthly_fee).toFixed(2)}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
