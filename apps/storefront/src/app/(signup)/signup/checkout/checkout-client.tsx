'use client';

import { signup as testIds } from '@lojao/test-utils/test-ids/signup';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MARKETING_PLANS, annualPrice, formatPlanPrice, type MarketingPlan } from '@/lib/marketing/plans';
import { checkSlug, slugify, submitSignup, type SignupBillingCycle, type SignupPlanSlug } from '@/lib/signup';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'reserved';

const STEPS = ['Sua loja', 'Sua conta', 'Confirmação'] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-center">
        {STEPS.map((_, i) => {
          const n = i + 1;
          const state = n < current ? 'completed' : n === current ? 'active' : 'pending';
          return (
            <div key={n} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  state === 'pending'
                    ? 'bg-azul-gelo text-azul-noite'
                    : 'bg-azul-comercio text-white'
                }`}
              >
                {state === 'completed' ? '✓' : n}
              </div>
              {n < STEPS.length && <div className="mx-2 h-0.5 w-10 bg-azul-gelo" />}
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-4 flex max-w-xs justify-between text-center text-xs font-semibold text-cinza-pedra">
        {STEPS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cinza-pedra">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-azul-gelo bg-white px-4 py-3 text-sm text-azul-noite placeholder-azul-ceu/60 focus:outline-none focus:ring-2 focus:ring-azul-comercio';

export function CheckoutClient({ planSlug }: { planSlug: SignupPlanSlug }) {
  const router = useRouter();
  const plan: MarketingPlan = MARKETING_PLANS.find((p) => p.slug === planSlug) ?? MARKETING_PLANS[1]!;

  const [step, setStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<SignupBillingCycle>('monthly');

  const [lojaNome, setLojaNome] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [segmento, setSegmento] = useState('');
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');

  const [adminNome, setAdminNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Slug auto-derivado do nome enquanto o usuário não editar manualmente.
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(lojaNome));
  }, [lojaNome, slugEdited]);

  // Verificação de disponibilidade do slug (debounce + abort).
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await checkSlug(slug, controller.signal);
        if (res.available) setSlugStatus('available');
        else setSlugStatus(res.reason === 'RESERVED' ? 'reserved' : 'taken');
      } catch {
        // abortado ou erro de rede — mantém checking até nova tentativa
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [slug]);

  const priceMonthly = plan.priceMonthly;
  const displayPrice =
    priceMonthly == null
      ? plan.priceLabel ?? 'Sob consulta'
      : billingCycle === 'annual'
        ? formatPlanPrice(annualPrice(priceMonthly))
        : formatPlanPrice(priceMonthly);
  const priceSuffix = priceMonthly == null ? '' : billingCycle === 'annual' ? '/ano' : '/mês';

  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (lojaNome.trim().length < 2) e.lojaNome = 'Informe o nome da loja.';
    if (slug.length < 2) e.slug = 'Slug inválido.';
    else if (slugStatus === 'taken') e.slug = 'Este endereço já está em uso.';
    else if (slugStatus === 'reserved') e.slug = 'Este endereço é reservado. Escolha outro.';
    else if (slugStatus !== 'available') e.slug = 'Aguarde a verificação do endereço.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (adminNome.trim().length < 2) e.adminNome = 'Informe seu nome.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido.';
    if (senha.length < 8) e.senha = 'Senha deve ter pelo menos 8 caracteres.';
    if (senha !== confirmar) e.confirmar = 'As senhas não conferem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(3, s + 1));
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    setSubmitting(true);
    const res = await submitSignup({
      planSlug,
      billingCycle,
      trial: true,
      loja: { nome: lojaNome.trim(), slug },
      admin: { nome: adminNome.trim(), email: email.trim().toLowerCase(), senha },
    });
    setSubmitting(false);

    if (res.ok) {
      const params = new URLSearchParams({ slug: res.data.tenantSlug, plan: planSlug });
      if (res.data.trialEndsAt) params.set('trial', res.data.trialEndsAt);
      router.push(`/signup/success?${params.toString()}`);
      return;
    }

    if (res.error.code === 'SLUG_EXISTS' || res.error.code === 'SLUG_RESERVED') {
      setErrors({ slug: res.error.message });
      setSlugStatus(res.error.code === 'SLUG_RESERVED' ? 'reserved' : 'taken');
      setStep(1);
      return;
    }
    setSubmitError(res.error.message);
  }

  const slugHint = (() => {
    if (slugStatus === 'checking') return <span className="text-cinza-pedra">Verificando…</span>;
    if (slugStatus === 'available') return <span className="text-verde-broto">Endereço disponível ✓</span>;
    if (slugStatus === 'taken') return <span className="text-red-600">Já está em uso</span>;
    if (slugStatus === 'reserved') return <span className="text-red-600">Endereço reservado</span>;
    return null;
  })();

  return (
    <div data-testid={testIds.checkoutPage} className="py-12">
      <div className="mx-auto max-w-5xl px-6">
        <StepIndicator current={step} />

        <div className="grid gap-8 md:grid-cols-3">
          {/* ESQUERDA: FORM POR STEP */}
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-azul-gelo bg-white p-8 shadow-sm">
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-extrabold text-azul-noite">Sua loja</h2>
                  <Field label="Nome da loja" error={errors.lojaNome}>
                    <input
                      className={inputClass}
                      value={lojaNome}
                      onChange={(e) => setLojaNome(e.target.value)}
                      placeholder="Minha Loja"
                    />
                  </Field>
                  <Field label="Endereço da loja (slug)" error={errors.slug}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-cinza-pedra">atalabs.com.br/store/</span>
                      <input
                        data-testid={testIds.checkoutSlugInput}
                        className={inputClass}
                        value={slug}
                        onChange={(e) => {
                          setSlugEdited(true);
                          setSlug(slugify(e.target.value));
                        }}
                        placeholder="minha-loja"
                      />
                    </div>
                    <p className="mt-1 text-xs">{slugHint}</p>
                  </Field>
                  <Field label="Segmento (opcional)">
                    <input
                      className={inputClass}
                      value={segmento}
                      onChange={(e) => setSegmento(e.target.value)}
                      placeholder="Moda, alimentos, serviços…"
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-extrabold text-azul-noite">Sua conta de administrador</h2>
                  <Field label="Nome completo" error={errors.adminNome}>
                    <input
                      className={inputClass}
                      value={adminNome}
                      onChange={(e) => setAdminNome(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </Field>
                  <Field label="E-mail" error={errors.email}>
                    <input
                      type="email"
                      className={inputClass}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                    />
                  </Field>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Senha" error={errors.senha}>
                      <input
                        type="password"
                        className={inputClass}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="mínimo 8 caracteres"
                      />
                    </Field>
                    <Field label="Confirmar senha" error={errors.confirmar}>
                      <input
                        type="password"
                        className={inputClass}
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                        placeholder="repita a senha"
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-extrabold text-azul-noite">Confirmação</h2>

                  <div className="rounded-xl bg-azul-nevoa p-4 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-cinza-pedra">Loja</span>
                      <span className="font-semibold text-azul-noite">{lojaNome}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-cinza-pedra">Endereço</span>
                      <span className="font-semibold text-azul-noite">atalabs.com.br/store/{slug}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-cinza-pedra">Admin</span>
                      <span className="font-semibold text-azul-noite">{email}</span>
                    </div>
                  </div>

                  {/* Ciclo de cobrança */}
                  <div>
                    <p className="mb-3 text-sm font-semibold text-azul-noite">Ciclo de cobrança</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(['monthly', 'annual'] as const).map((cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => setBillingCycle(cycle)}
                          className={`rounded-xl border-2 p-4 text-left transition-all ${
                            billingCycle === cycle
                              ? 'border-azul-comercio bg-azul-nevoa'
                              : 'border-azul-gelo hover:border-azul-comercio'
                          }`}
                        >
                          <span className="block text-sm font-semibold text-azul-noite">
                            {cycle === 'monthly' ? 'Mensal' : 'Anual'}
                          </span>
                          <span className="block text-xs text-cinza-pedra">
                            {cycle === 'monthly' ? 'Flexível, cancele quando quiser' : 'Economize 15% no ano'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-azul-gelo bg-white p-4">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-verde-broto"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                    <p className="text-sm text-azul-noite">
                      <strong>14 dias de trial gratuito</strong>, sem cartão de crédito. A cobrança só começa após
                      o período de teste.
                    </p>
                  </div>

                  {submitError && (
                    <p data-testid={testIds.checkoutError} className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                      {submitError}
                    </p>
                  )}
                </div>
              )}

              {/* NAV BUTTONS */}
              <div className="mt-8 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    className="text-sm font-semibold text-cinza-pedra transition-colors hover:text-azul-noite"
                  >
                    ← Voltar
                  </button>
                ) : (
                  <span />
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    data-testid={testIds.checkoutNext}
                    onClick={next}
                    className="rounded-xl bg-azul-comercio px-8 py-3 text-sm font-extrabold text-white transition-colors hover:bg-azul-noite"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid={testIds.checkoutSubmit}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-xl bg-gradient-to-r from-azul-comercio to-azul-vivido px-8 py-3 text-sm font-extrabold text-white transition-all hover:shadow-lg disabled:opacity-60"
                  >
                    {submitting ? 'Criando sua loja…' : '✓ Criar minha loja'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DIREITA: RESUMO */}
          <aside className="md:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-azul-gelo bg-white p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-azul-noite">Resumo do plano</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-azul-comercio">{displayPrice}</span>
                {priceSuffix && <span className="text-sm text-cinza-pedra">{priceSuffix}</span>}
              </div>
              <p className="mt-1 text-sm font-semibold text-azul-noite">{plan.name}</p>
              <p className="text-xs text-cinza-pedra">{plan.audience}</p>

              <ul className="mt-6 space-y-3 border-t border-azul-gelo pt-6 text-sm">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-azul-noite">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-azul-comercio" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 rounded-xl bg-azul-nevoa p-3 text-center text-xs text-azul-comercio">
                14 dias grátis · sem cartão · cancele quando quiser
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
