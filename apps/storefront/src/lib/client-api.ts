'use client';

import { API_URL, TENANT_SLUG } from '@/lib/config';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const hasBody = init.body != null && init.body !== '';
  const headers: Record<string, string> = {
    'X-Tenant-Slug': TENANT_SLUG,
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    data?: T;
  };

  if (!res.ok) {
    throw new ApiError(res.status, body.code ?? 'INTERNAL_ERROR', body.error ?? 'Erro inesperado.');
  }

  return body as T;
}

export interface AuthUser {
  id: number;
  nome: string;
  email?: string;
  role: string;
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const { data } = await apiFetch<{ data: { usuario: AuthUser } }>('/api/v1/auth/me');
    return data.usuario;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export async function login(email: string, senha: string): Promise<AuthUser> {
  const { data } = await apiFetch<{ data: AuthUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  return data;
}

export async function logout(): Promise<void> {
  await apiFetch('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export interface RegisterInput {
  nome: string;
  email: string;
  senha: string;
  confirmacao: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export async function register(input: RegisterInput): Promise<void> {
  await apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function recoverPassword(email: string): Promise<string> {
  const { data } = await apiFetch<{ data: { message: string } }>('/api/v1/auth/recover-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return data.message;
}

export async function resetPassword(
  token: string,
  senha: string,
  confirmacao: string,
): Promise<void> {
  await apiFetch(`/api/v1/auth/reset-password/${token}`, {
    method: 'POST',
    body: JSON.stringify({ senha, confirmacao }),
  });
}

export interface CartItem {
  id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto_id: number;
  nome: string;
  subtitulo: string | null;
  imagem: string | null;
}

export async function fetchCart(): Promise<{ itens: CartItem[]; total: number }> {
  const { data } = await apiFetch<{ data: { itens: CartItem[]; total: number } }>('/api/v1/cart');
  return data;
}

export async function addToCart(produtoId: number, quantidade = 1): Promise<void> {
  await apiFetch('/api/v1/cart/items', {
    method: 'POST',
    body: JSON.stringify({ produto_id: produtoId, quantidade }),
  });
}

export async function updateCartItem(itemId: number, quantidade: number): Promise<void> {
  await apiFetch(`/api/v1/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantidade }),
  });
}

export async function removeCartItem(itemId: number): Promise<void> {
  await apiFetch(`/api/v1/cart/items/${itemId}`, { method: 'DELETE' });
}

export interface FreteOpcao {
  id: string;
  nome: string;
  transportadora: string;
  prazo: string;
  valor: number;
}

export async function calculateShipping(
  cep: string,
  subtotal: number,
): Promise<FreteOpcao[]> {
  const { data } = await apiFetch<{ data: { opcoes: FreteOpcao[] } }>('/api/v1/shipping/calculate', {
    method: 'POST',
    body: JSON.stringify({ cep_destino: cep, subtotal }),
  });
  return data.opcoes;
}

export interface CheckoutPreview {
  itens: CartItem[];
  subtotal: number;
  modulo_agenda: boolean;
  sumup_habilitado: boolean;
  stripe_public_key: string;
}

export async function fetchCheckoutPreview(): Promise<CheckoutPreview> {
  const { data } = await apiFetch<{ data: CheckoutPreview }>('/api/v1/checkout');
  return data;
}

export interface CheckoutInput {
  nome_entrega: string;
  email_entrega: string;
  telefone_entrega?: string;
  cpf_entrega?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  metodo_pagamento: 'pix' | 'boleto' | 'cartao' | 'sumup_online' | 'teste';
  data_evento?: string;
  stripe_payment_method_id?: string;
  frete_valor?: number;
  frete_servico?: string;
}

export async function submitCheckout(
  input: CheckoutInput,
): Promise<{ pedido_id: number; status: string; redirect_url?: string }> {
  const { data } = await apiFetch<{
    data: { pedido_id: number; status: string; redirect_url?: string };
  }>('/api/v1/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data;
}

export interface CheckoutResult {
  pedido: {
    id: number;
    status: string;
    total: number;
    metodo_pagamento: string;
  };
  itens: Array<{ nome: string; quantidade: number; subtotal: number }>;
  pagamento: { status: string } | null;
  pixInfo: { qr_code?: string; copia_cola?: string } | null;
  boletoUrl: string | null;
}

export async function fetchCheckoutResult(pedidoId: number): Promise<CheckoutResult> {
  const { data } = await apiFetch<{ data: CheckoutResult }>(`/api/v1/checkout/${pedidoId}/result`);
  return data;
}

export interface BuyerOrder {
  id: number;
  status: string;
  total: number;
  metodo_pagamento: string | null;
  created_at: string;
  total_itens: number;
}

export async function fetchOrders(): Promise<BuyerOrder[]> {
  const { data } = await apiFetch<{ data: BuyerOrder[] }>('/api/v1/orders');
  return data;
}

export async function fetchPaymentConfig(): Promise<{
  stripe_public_key: string;
  sumup_enabled: boolean;
}> {
  const { data } = await apiFetch<{
    data: { stripe_public_key: string; sumup_enabled: boolean };
  }>('/api/v1/public/payment-config');
  return data;
}

export async function lookupCep(cep: string): Promise<{
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}> {
  const digits = cep.replace(/\D/g, '');
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  return res.json() as Promise<{
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    erro?: boolean;
  }>;
}
