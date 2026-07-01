import type pg from 'pg';

const CONFIG_KEYS = [
  'controla_estoque',
  'reservar_estoque_carrinho',
  'modulo_agenda',
  'habilitar_sumup',
  'frete_cep_origem',
  'frete_fixo',
  'frete_gratis_acima',
  'melhor_envio_token',
  'melhor_envio_sandbox',
  'frete_peso_padrao',
  'frete_altura',
  'frete_largura',
  'frete_comprimento',
] as const;

export async function fetchConfigRows(
  db: pg.Pool,
): Promise<{ chave: string; valor: string | null }[]> {
  const r = await db.query(
    `SELECT chave, valor FROM configuracoes WHERE chave = ANY($1::text[])`,
    [CONFIG_KEYS],
  );
  return r.rows as { chave: string; valor: string | null }[];
}

export async function upsertConfigRow(db: pg.Pool, chave: string, valor: string): Promise<void> {
  await db.query(
    `INSERT INTO configuracoes (chave, valor, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
    [chave, valor],
  );
}
