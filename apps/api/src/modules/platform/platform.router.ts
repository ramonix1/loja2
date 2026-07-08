import type { FastifyInstance } from 'fastify';

import { requirePlatformAdmin } from '../../plugins/auth-guard.js';
import {
  getPlatformDashboardChartsHandler,
  getPlatformDashboardStatsHandler,
  getPlatformHealth,
  getPlatformMerchants,
  getPlatformReports,
  getPlatformStore,
  getPlatformStoreBilling,
  getPlatformStoreMetrics,
  getPlatformStores,
  patchPlatformStore,
  postEndImpersonation,
  postImpersonate,
  postPlatformLogin,
  postPlatformStore,
} from './platform.controller.js';

export async function platformRouter(app: FastifyInstance): Promise<void> {
  app.post('/platform/login', postPlatformLogin);

  // Disponível fora do guard (a sessão ativa pode ser merchant durante impersonate)
  app.post('/platform/end-impersonation', postEndImpersonation);

  app.register(async (scoped) => {
    scoped.addHook('preHandler', requirePlatformAdmin);

    scoped.get('/platform/dashboard/stats', getPlatformDashboardStatsHandler);
    scoped.get('/platform/dashboard/charts', getPlatformDashboardChartsHandler);
    scoped.get('/platform/stores', getPlatformStores);
    scoped.get('/platform/merchants', getPlatformMerchants);
    scoped.post('/platform/stores', postPlatformStore);
    scoped.get('/platform/stores/:slug', getPlatformStore);
    scoped.get('/platform/stores/:slug/metrics', getPlatformStoreMetrics);
    scoped.get('/platform/stores/:slug/billing', getPlatformStoreBilling);
    scoped.get('/platform/health', getPlatformHealth);
    scoped.get('/platform/reports', getPlatformReports);
    scoped.patch('/platform/stores/:slug', patchPlatformStore);
    scoped.post('/platform/stores/:slug/impersonate', postImpersonate);
  });
}
