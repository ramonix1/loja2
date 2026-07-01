import type pg from 'pg';

import { getConfigs } from '../../lib/config.js';

export async function fetchTenantConfigs(db: pg.Pool): Promise<Awaited<ReturnType<typeof getConfigs>>> {
  return getConfigs(db);
}
