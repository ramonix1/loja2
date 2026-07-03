'use client';

import { Button, Card, FieldInput, Label } from '@lojao/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ApiError, lookupCep, register } from '@/lib/client-api';
import {
  storeErrorTextClass,
  storeLinkClass,
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
    <Card surface="store" className="mx-auto max-w-2xl rounded-2xl p-8 shadow-sm">
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
          <Label className="mb-1 block text-[var(--store-text-muted)]">Nome completo</Label>
          <FieldInput
            surface="store"
            required
            value={form.nome}
            onChange={(e) => update('nome', e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">E-mail</Label>
          <FieldInput
            surface="store"
            required
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">Telefone</Label>
          <FieldInput
            surface="store"
            required
            value={form.telefone}
            onChange={(e) => update('telefone', e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">Senha</Label>
          <FieldInput
            surface="store"
            required
            type="password"
            minLength={8}
            value={form.senha}
            onChange={(e) => update('senha', e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">Confirmar senha</Label>
          <FieldInput
            surface="store"
            required
            type="password"
            value={form.confirmacao}
            onChange={(e) => update('confirmacao', e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">CEP</Label>
          <div className="flex gap-2">
            <FieldInput
              surface="store"
              required
              value={form.cep}
              onChange={(e) => update('cep', e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              surface="store"
              onClick={buscarCep}
              className="shrink-0 whitespace-nowrap px-3"
            >
              Buscar
            </Button>
          </div>
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">Número</Label>
          <FieldInput
            surface="store"
            required
            value={form.numero}
            onChange={(e) => update('numero', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1 block text-[var(--store-text-muted)]">Logradouro</Label>
          <FieldInput
            surface="store"
            required
            value={form.logradouro}
            onChange={(e) => update('logradouro', e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">Bairro</Label>
          <FieldInput
            surface="store"
            required
            value={form.bairro}
            onChange={(e) => update('bairro', e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">Cidade</Label>
          <FieldInput
            surface="store"
            required
            value={form.cidade}
            onChange={(e) => update('cidade', e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1 block text-[var(--store-text-muted)]">Estado (UF)</Label>
          <FieldInput
            surface="store"
            required
            maxLength={2}
            value={form.estado}
            onChange={(e) => update('estado', e.target.value.toUpperCase())}
          />
        </div>
        <div className="sm:col-span-2">
          <Button
            type="submit"
            surface="store"
            variant="primary"
            disabled={loading}
            className="w-full py-2.5"
          >
            {loading ? 'Cadastrando…' : 'Criar conta'}
          </Button>
        </div>
      </form>

      <p className={storeSubtleClass('mt-4 text-center text-sm')}>
        Já tem conta?{' '}
        <Link href={loginHref} className={storeLinkClass()}>
          Entrar
        </Link>
      </p>
    </Card>
  );
}
