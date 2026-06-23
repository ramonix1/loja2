import { browserApiBase } from '@/lib/config';

function signupApiPath(suffix = ''): string {
  return `${browserApiBase()}/api/v1/public/signup${suffix}`;
}

export type SignupPlanSlug = 'starter' | 'professional' | 'enterprise';
export type SignupBillingCycle = 'monthly' | 'annual';

export interface SignupPayload {
  planSlug: SignupPlanSlug;
  billingCycle: SignupBillingCycle;
  trial: boolean;
  loja: { nome: string; slug: string };
  admin: { nome: string; email: string; senha: string };
}

export interface SignupResult {
  tenantSlug: string;
  lojaNome: string;
  adminEmail: string;
  storefrontUrl: string;
  adminUrl: string;
  trialEndsAt?: string;
}

export type SlugCheck =
  | { available: true }
  | { available: false; reason: 'RESERVED' | 'TAKEN' };

/** Normaliza um texto livre em um slug candidato (a-z, 0-9, hífen). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/** Consulta disponibilidade do slug (GET público). */
export async function checkSlug(slug: string, signal?: AbortSignal): Promise<SlugCheck> {
  const res = await fetch(
    `${signupApiPath()}/check-slug?slug=${encodeURIComponent(slug)}`,
    { signal },
  );
  const body = (await res.json().catch(() => ({}))) as {
    data?: { available: boolean; reason?: 'RESERVED' | 'TAKEN' };
  };
  if (!res.ok || !body.data) {
    // Em falha de rede tratamos como indisponível conservadoramente.
    return { available: false, reason: 'TAKEN' };
  }
  return body.data.available
    ? { available: true }
    : { available: false, reason: body.data.reason ?? 'TAKEN' };
}

export type SignupError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type SignupResponse =
  | { ok: true; data: SignupResult }
  | { ok: false; error: SignupError };

/** Envia o cadastro self-service (POST público). */
export async function submitSignup(payload: SignupPayload): Promise<SignupResponse> {
  const res = await fetch(signupApiPath(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => ({}))) as {
    data?: SignupResult;
    error?: string;
    code?: string;
    details?: Record<string, string[]>;
  };

  if (res.ok && body.data) {
    return { ok: true, data: body.data };
  }

  return {
    ok: false,
    error: {
      code: body.code ?? 'INTERNAL_ERROR',
      message: body.error ?? 'Não foi possível concluir o cadastro. Tente novamente.',
      fieldErrors: body.details,
    },
  };
}
