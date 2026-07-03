'use client';

import { FieldInput, FieldTextarea } from '@lojao/ui';
import { marketing as testIds } from '@lojao/test-utils/test-ids/marketing';
import { FormEvent } from 'react';

interface ContactFormProps {
  className?: string;
}

const marketingInputClass =
  'marketing-input w-full rounded-xl border border-cinza-areia bg-white px-4 py-3.5 text-sm text-verde-conde placeholder:text-cinza-areia/60';

export function ContactForm({ className = '' }: ContactFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form
      data-testid={testIds.landingContactForm}
      onSubmit={handleSubmit}
      className={`grid gap-6 md:grid-cols-2 ${className}`}
    >
      <div>
        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-cinza-pedra">
          Nome
        </label>
        <FieldInput
          surface="store"
          type="text"
          name="nome"
          placeholder="Seu nome completo"
          className={marketingInputClass}
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-cinza-pedra">
          E-mail
        </label>
        <FieldInput
          surface="store"
          type="email"
          name="email"
          placeholder="seu@email.com"
          className={marketingInputClass}
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-cinza-pedra">
          Empresa
        </label>
        <FieldInput
          surface="store"
          type="text"
          name="empresa"
          placeholder="Nome da empresa"
          className={marketingInputClass}
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-cinza-pedra">
          Telefone
        </label>
        <FieldInput
          surface="store"
          type="tel"
          name="telefone"
          placeholder="(00) 00000-0000"
          className={marketingInputClass}
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-cinza-pedra">
          Mensagem
        </label>
        <FieldTextarea
          surface="store"
          name="mensagem"
          rows={4}
          placeholder="Como podemos ajudar?"
          className={`marketing-textarea ${marketingInputClass} resize-none`}
        />
      </div>
      <div className="text-center md:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center gap-3 rounded-full bg-verde-broto px-10 py-4 text-base font-extrabold text-white shadow-md transition-all hover:opacity-90"
        >
          Enviar mensagem
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </form>
  );
}
