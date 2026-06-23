import type pg from 'pg';

/** Porta `configController.getConfigs` — mapa chave→valor das configuracoes. */
export async function getConfigs(db: pg.Pool): Promise<Record<string, string>> {
  const r = await db.query('SELECT chave, valor FROM configuracoes').catch(() => ({ rows: [] }));
  const cfg: Record<string, string> = {};
  for (const row of r.rows as Array<{ chave: string; valor: string | null }>) {
    cfg[row.chave] = row.valor ?? '';
  }
  return cfg;
}

export async function getLojaInfo(db: pg.Pool): Promise<{ nome: string; email: string }> {
  const r = await db
    .query("SELECT chave, valor FROM configuracoes WHERE chave IN ('loja_nome','loja_email')")
    .catch(() => ({ rows: [] }));
  const cfg: Record<string, string> = {};
  for (const row of r.rows as Array<{ chave: string; valor: string | null }>) {
    cfg[row.chave] = row.valor ?? '';
  }
  return { nome: cfg.loja_nome || 'Ata Commerce Demo', email: cfg.loja_email || '' };
}
