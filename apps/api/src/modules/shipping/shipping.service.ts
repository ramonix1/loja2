import type pg from 'pg';

import { calcularOpcoesFrete } from '../../services/frete.service.js';
import { fetchTenantConfigs } from './shipping.repository.js';

export async function calculateShipping(
  db: pg.Pool,
  cepDestino: string,
  subtotal: number,
): Promise<Awaited<ReturnType<typeof calcularOpcoesFrete>>> {
  const configs = await fetchTenantConfigs(db);
  return calcularOpcoesFrete({
    cepDestino,
    subtotal,
    configs,
  });
}
