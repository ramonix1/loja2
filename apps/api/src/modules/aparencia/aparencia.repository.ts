import type { Pool } from 'pg';

export async function fetchLojaConfigRows(
  db: Pool,
): Promise<{ chave: string; valor: string | null }[]> {
  const r = await db.query(
    "SELECT chave, valor FROM configuracoes WHERE chave LIKE 'loja_%'",
  );
  return r.rows as { chave: string; valor: string | null }[];
}

export async function upsertConfigRows(db: Pool, pares: [string, string][]): Promise<void> {
  for (const [chave, valor] of pares) {
    await db.query(
      `INSERT INTO configuracoes (chave, valor, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
      [chave, valor],
    );
  }
}
