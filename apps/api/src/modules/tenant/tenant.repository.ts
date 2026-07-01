import type pg from 'pg';

export async function findLojaConfig(db: pg.Pool): Promise<Record<string, string>> {
  const result = await db.query(
    "SELECT chave, valor FROM configuracoes WHERE chave LIKE 'loja_%'",
  );

  const cfg: Record<string, string> = {};
  for (const row of result.rows as { chave: string; valor: string | null }[]) {
    cfg[row.chave] = row.valor ?? '';
  }
  return cfg;
}
