/**
 * Cria pedido via API (método teste) — usado por Playwright Fase 6.
 *
 * Pré-requisito: API rodando, Postgres com seed de teste, produto checkout no catálogo.
 */

export interface SeedPedidoTesteOptions {
  apiUrl: string;
  sessionCookie: string;
  tenantSlug: string;
  /** ID do produto a adicionar ao carrinho (default: 1 ou `E2E_PRODUCT_ID`) */
  produtoId?: number;
}

const DEFAULT_ADDRESS = {
  nome_entrega: 'Comprador Teste',
  email_entrega: 'comprador-test@loja.com',
  telefone_entrega: '11999999999',
  cpf_entrega: '52998224725',
  cep: '01310-100',
  logradouro: 'Av Paulista',
  numero: '1000',
  complemento: 'Apto 1',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  frete_valor: 0,
  frete_servico: 'gratis',
};

/** Login programático de comprador (role usuario). */
export async function loginComprador(
  apiUrl: string,
  opts: { email?: string; senha?: string; tenantSlug?: string } = {},
): Promise<string> {
  const email = opts.email ?? 'comprador-test@loja.com';
  const senha = opts.senha ?? 'comprador123';
  const tenantSlug = opts.tenantSlug ?? 'loja';

  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': tenantSlug },
    body: JSON.stringify({ email, senha }),
  });
  if (!res.ok) throw new Error(`loginComprador falhou: HTTP ${res.status}`);
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) throw new Error('loginComprador: sem Set-Cookie');
  return setCookie.split(';')[0]!;
}

/**
 * Cria pedido pago via checkout método `teste` (somente dev/test).
 * Adiciona o produto checkout padrão ao carrinho antes do POST checkout.
 */
export async function seedPedidoTeste(opts: SeedPedidoTesteOptions): Promise<{ pedidoId: number }> {
  const base = opts.apiUrl.replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': opts.tenantSlug,
    Cookie: opts.sessionCookie,
  };

  const produtoId = opts.produtoId ?? 1;

  const addRes = await fetch(`${base}/api/v1/cart/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ produto_id: produtoId, quantidade: 1 }),
  });
  if (!addRes.ok) {
    throw new Error(`seedPedidoTeste: add cart falhou HTTP ${addRes.status}`);
  }

  const checkoutRes = await fetch(`${base}/api/v1/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...DEFAULT_ADDRESS, metodo_pagamento: 'teste' }),
  });
  if (!checkoutRes.ok) {
    throw new Error(`seedPedidoTeste: checkout falhou HTTP ${checkoutRes.status}`);
  }

  const checkoutJson = (await checkoutRes.json()) as { data: { pedido_id: number } };
  return { pedidoId: checkoutJson.data.pedido_id };
}
