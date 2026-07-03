/** Base de conexão (host/porta/credenciais) derivada da `DATABASE_URL`. */
export interface BaseConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  defaultDbName: string;
}

function pgSsl(): boolean | { rejectUnauthorized: false } {
  const sslEnabled =
    (process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL) &&
    process.env.PGSSL !== 'disable';
  return sslEnabled ? { rejectUnauthorized: false } : false;
}

/**
 * Lê a `DATABASE_URL` e extrai host/porta/credenciais + nome do banco padrão.
 * Lança se `DATABASE_URL` não estiver definida (obrigatória fora de testes com
 * banco explícito).
 */
export function baseConnectionFromEnv(): BaseConnection {
  const dbUrl =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/atacommerce';
  const url = new URL(dbUrl);
  return {
    host: url.hostname,
    port: Number.parseInt(url.port, 10) || 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    defaultDbName: url.pathname.replace(/^\//, '') || 'atacommerce',
  };
}

/** Nome do banco padrão da plataforma (master). */
export function defaultDbName(): string {
  return baseConnectionFromEnv().defaultDbName;
}

/** Monta connection string trocando só o nome do banco. */
export function connectionUrlForDb(dbName: string): string {
  const dbUrl =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/atacommerce';
  const url = new URL(dbUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
}

export { pgSsl };
