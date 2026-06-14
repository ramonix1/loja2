export {
  createMasterDb,
  createTenantDb,
  getCachedTenantDb,
  invalidateTenantDbCache,
  runMigrations,
  type MasterDatabase,
  type TenantDatabase,
} from './client.js';

export { and, asc, count, desc, eq, sql } from 'drizzle-orm';

export * from './schema/master/index.js';
export * from './schema/tenant/index.js';
