'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ApiError, lookupCep, register } from '@/lib/client-api';

export function RegisterForm() {
  const router = useRouter();
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
      router.push('/login?info=cadastro');
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

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500';

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Criar conta</h1>

      {errors.length > 0 ? (
        <ul className="mb-4 space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Nome completo</label>
          <input required className={inputClass} value={form.nome} onChange={(e) => update('nome', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <input required type="email" className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Telefone</label>
          <input required className={inputClass} value={form.telefone} onChange={(e) => update('telefone', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Senha</label>
          <input required type="password" minLength={8} className={inputClass} value={form.senha} onChange={(e) => update('senha', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirmar senha</label>
          <input required type="password" className={inputClass} value={form.confirmacao} onChange={(e) => update('confirmacao', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">CEP</label>
          <div className="flex gap-2">
            <input required className={inputClass} value={form.cep} onChange={(e) => update('cep', e.target.value)} />
            <button type="button" onClick={buscarCep} className="btn-outline whitespace-nowrap px-3">
              Buscar
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Número</label>
          <input required className={inputClass} value={form.numero} onChange={(e) => update('numero', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Logradouro</label>
          <input required className={inputClass} value={form.logradouro} onChange={(e) => update('logradouro', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Bairro</label>
          <input required className={inputClass} value={form.bairro} onChange={(e) => update('bairro', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cidade</label>
          <input required className={inputClass} value={form.cidade} onChange={(e) => update('cidade', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Estado (UF)</label>
          <input required maxLength={2} className={inputClass} value={form.estado} onChange={(e) => update('estado', e.target.value.toUpperCase())} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Cadastrando…' : 'Criar conta'}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Já tem conta?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
