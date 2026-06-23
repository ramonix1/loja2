'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ApiError, lookupCep, register } from '@/lib/client-api';
import {
  storeErrorTextClass,
  storeInputClass,
  storeLabelClass,
  storeLinkClass,
  storePanelClass,
  storeSectionTitleClass,
  storeSubtleClass,
} from '@/lib/store-styles';
import { useStoreHref } from '@/lib/use-store-href';

export function RegisterForm() {
  const router = useRouter();
  const loginHref = useStoreHref('/login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmacao: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function buscarCep() {
    const data = await lookupCep(form.cep);
    if (data.erro) return;
    setForm((f) => ({
      ...f,
      logradouro: data.logradouro ?? f.logradouro,
      bairro: data.bairro ?? f.bairro,
      cidade: data.localidade ?? f.cidade,
      estado: data.uf ?? f.estado,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      await register(form);
      router.push(`${loginHref}?info=cadastro`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors([err.message]);
      } else {
        setErrors(['Erro ao cadastrar. Tente novamente.']);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={storePanelClass('mx-auto max-w-2xl rounded-2xl p-8')}>
      <h1 className={storeSectionTitleClass('mb-6')}>Criar conta</h1>

      {errors.length > 0 ? (
        <ul
          className={storeErrorTextClass(
            'mb-4 space-y-1 rounded-lg border border-[color-mix(in_srgb,var(--store-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--store-error)_12%,var(--store-surface))] p-3 text-sm',
          )}
        >
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={storeLabelClass()}>Nome completo</label>
          <input required className={storeInputClass()} value={form.nome} onChange={(e) => update('nome', e.target.value)} />
        </div>
        <div>
          <label className={storeLabelClass()}>E-mail</label>
          <input required type="email" className={storeInputClass()} value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div>
          <label className={storeLabelClass()}>Telefone</label>
          <input required className={storeInputClass()} value={form.telefone} onChange={(e) => update('telefone', e.target.value)} />
        </div>
        <div>
          <label className={storeLabelClass()}>Senha</label>
          <input required type="password" minLength={8} className={storeInputClass()} value={form.senha} onChange={(e) => update('senha', e.target.value)} />
        </div>
        <div>
          <label className={storeLabelClass()}>Confirmar senha</label>
          <input required type="password" className={storeInputClass()} value={form.confirmacao} onChange={(e) => update('confirmacao', e.target.value)} />
        </div>
        <div>
          <label className={storeLabelClass()}>CEP</label>
          <div className="flex gap-2">
            <input required className={storeInputClass()} value={form.cep} onChange={(e) => update('cep', e.target.value)} />
            <button type="button" onClick={buscarCep} className="btn-outline whitespace-nowrap px-3">
              Buscar
            </button>
          </div>
        </div>
        <div>
          <label className={storeLabelClass()}>Número</label>
          <input required className={storeInputClass()} value={form.numero} onChange={(e) => update('numero', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={storeLabelClass()}>Logradouro</label>
          <input required className={storeInputClass()} value={form.logradouro} onChange={(e) => update('logradouro', e.target.value)} />
        </div>
        <div>
          <label className={storeLabelClass()}>Bairro</label>
          <input required className={storeInputClass()} value={form.bairro} onChange={(e) => update('bairro', e.target.value)} />
        </div>
        <div>
          <label className={storeLabelClass()}>Cidade</label>
          <input required className={storeInputClass()} value={form.cidade} onChange={(e) => update('cidade', e.target.value)} />
        </div>
        <div>
          <label className={storeLabelClass()}>Estado (UF)</label>
          <input required maxLength={2} className={storeInputClass()} value={form.estado} onChange={(e) => update('estado', e.target.value.toUpperCase())} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Cadastrando…' : 'Criar conta'}
          </button>
        </div>
      </form>

      <p className={storeSubtleClass('mt-4 text-center text-sm')}>
        Já tem conta?{' '}
        <Link href={loginHref} className={storeLinkClass()}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
