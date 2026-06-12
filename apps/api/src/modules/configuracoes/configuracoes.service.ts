import type {
  ConfiguracoesConfig,
  UpdateConfiguracoesInput,
} from '@lojao/types/configuracoes';
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

const DEFAULTS: ConfiguracoesConfig = {
  controla_estoque: false,
  reservar_estoque_carrinho: false,
  modulo_agenda: false,
  habilitar_sumup: false,
  frete_cep_origem: '',
  frete_fixo: 0,
  frete_gratis_acima: 0,
  melhor_envio_token: '',
  melhor_envio_sandbox: true,
  frete_peso_padrao: 300,
  frete_altura: 4,
  frete_largura: 12,
  frete_comprimento: 17,
};

function parseBool(value: string | null | undefined, fallback: boolean): boolean {
  if (value == null || value === '') return fallback;
  return value === 'true';
}

function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

function mapRowToConfig(rows: { chave: string; valor: string | null }[]): ConfiguracoesConfig {
  const cfg: Record<string, string | null> = {};
  for (const row of rows) {
    cfg[row.chave] = row.valor;
  }

  return {
    controla_estoque: parseBool(cfg.controla_estoque, DEFAULTS.controla_estoque),
    reservar_estoque_carrinho: parseBool(
      cfg.reservar_estoque_carrinho,
      DEFAULTS.reservar_estoque_carrinho,
    ),
    modulo_agenda: parseBool(cfg.modulo_agenda, DEFAULTS.modulo_agenda),
    habilitar_sumup: parseBool(cfg.habilitar_sumup, DEFAULTS.habilitar_sumup),
    frete_cep_origem: cfg.frete_cep_origem ?? DEFAULTS.frete_cep_origem,
    frete_fixo: Number.parseFloat(cfg.frete_fixo ?? String(DEFAULTS.frete_fixo)) || 0,
    frete_gratis_acima:
      Number.parseFloat(cfg.frete_gratis_acima ?? String(DEFAULTS.frete_gratis_acima)) || 0,
    melhor_envio_token: cfg.melhor_envio_token ?? DEFAULTS.melhor_envio_token,
    melhor_envio_sandbox: parseBool(cfg.melhor_envio_sandbox, DEFAULTS.melhor_envio_sandbox),
    frete_peso_padrao:
      Number.parseInt(cfg.frete_peso_padrao ?? String(DEFAULTS.frete_peso_padrao), 10) ||
      DEFAULTS.frete_peso_padrao,
    frete_altura: Number.parseFloat(cfg.frete_altura ?? String(DEFAULTS.frete_altura)) || 4,
    frete_largura: Number.parseFloat(cfg.frete_largura ?? String(DEFAULTS.frete_largura)) || 12,
    frete_comprimento:
      Number.parseFloat(cfg.frete_comprimento ?? String(DEFAULTS.frete_comprimento)) || 17,
  };
}

/** Porta `configController.getConfigs` — chaves operacionais da loja. */
export async function getConfiguracoes(db: pg.Pool): Promise<ConfiguracoesConfig> {
  try {
    const r = await db.query(
      `SELECT chave, valor FROM configuracoes WHERE chave = ANY($1::text[])`,
      [CONFIG_KEYS],
    );
    return mapRowToConfig(r.rows as { chave: string; valor: string | null }[]);
  } catch {
    return { ...DEFAULTS };
  }
}

/** Porta `configController.salvarConfiguracoes`. */
export async function updateConfiguracoes(
  db: pg.Pool,
  input: UpdateConfiguracoesInput,
): Promise<ConfiguracoesConfig> {
  const pares: [string, string][] = [
    ['controla_estoque', input.controla_estoque ? 'true' : 'false'],
    ['reservar_estoque_carrinho', input.reservar_estoque_carrinho ? 'true' : 'false'],
    ['modulo_agenda', input.modulo_agenda ? 'true' : 'false'],
    ['habilitar_sumup', input.habilitar_sumup ? 'true' : 'false'],
    ['frete_cep_origem', formatCep(input.frete_cep_origem ?? '')],
    ['frete_fixo', String(input.frete_fixo ?? 0)],
    ['frete_gratis_acima', String(input.frete_gratis_acima ?? 0)],
    ['melhor_envio_token', (input.melhor_envio_token ?? '').trim()],
    ['melhor_envio_sandbox', input.melhor_envio_sandbox ? 'true' : 'false'],
    ['frete_peso_padrao', String(input.frete_peso_padrao ?? 300)],
    ['frete_altura', String(input.frete_altura ?? 4)],
    ['frete_largura', String(input.frete_largura ?? 12)],
    ['frete_comprimento', String(input.frete_comprimento ?? 17)],
  ];

  for (const [chave, valor] of pares) {
    await db.query(
      `INSERT INTO configuracoes (chave, valor, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
      [chave, valor],
    );
  }

  return getConfiguracoes(db);
}
