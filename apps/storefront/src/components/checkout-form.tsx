'use client';

import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { BRL } from '@/lib/api';
import { IS_DEV } from '@/lib/config';
import {
  ApiError,
  calculateShipping,
  fetchCheckoutPreview,
  fetchMe,
  lookupCep,
  submitCheckout,
  type CheckoutPreview,
  type FreteOpcao,
} from '@/lib/client-api';

export function CheckoutForm() {
  const router = useRouter();
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freteOpcoes, setFreteOpcoes] = useState<FreteOpcao[]>([]);
  const [freteSelecionado, setFreteSelecionado] = useState<FreteOpcao | null>(null);
  const [metodo, setMetodo] = useState<'pix' | 'boleto' | 'cartao' | 'sumup_online' | 'teste'>('pix');

  const [form, setForm] = useState({
    nome_entrega: '',
    email_entrega: '',
    telefone_entrega: '',
    cpf_entrega: '',
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

  useEffect(() => {
    async function load() {
      try {
        const [me, data] = await Promise.all([fetchMe(), fetchCheckoutPreview()]);
        setPreview(data);
        setForm((f) => ({
          ...f,
          nome_entrega: me?.nome ?? f.nome_entrega,
          email_entrega: me?.email ?? f.email_entrega,
        }));
        if (IS_DEV) setMetodo('teste');
      } catch {
        router.push('/login?redirect=/checkout');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

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
    await calcularFrete(form.cep);
  }

  async function calcularFrete(cep: string) {
    if (!preview) return;
    const opcoes = await calculateShipping(cep, preview.subtotal);
    setFreteOpcoes(opcoes);
    setFreteSelecionado(opcoes[0] ?? null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!preview) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await submitCheckout({
        ...form,
        metodo_pagamento: metodo,
        frete_valor: freteSelecionado?.valor ?? 0,
        frete_servico: freteSelecionado?.id ?? 'gratis',
      });

      if (result.redirect_url?.startsWith('http')) {
        window.location.href = result.redirect_url;
        return;
      }

      router.push(`/checkout/resultado/${result.pedido_id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao finalizar pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500';

  if (loading) return <p className="text-center text-gray-500">Carregando checkout…</p>;
  if (!preview || preview.itens.length === 0) {
    return <p className="text-center text-gray-500">Carrinho vazio. <a href="/carrinho" className="text-blue-600">Voltar</a></p>;
  }

  const totalComFrete = preview.subtotal + (freteSelecionado?.valor ?? 0);

  return (
    <form data-testid={testIds.checkoutForm} onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Dados de entrega</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Nome</label>
              <input required className={inputClass} value={form.nome_entrega} onChange={(e) => update('nome_entrega', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input required type="email" className={inputClass} value={form.email_entrega} onChange={(e) => update('email_entrega', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <input className={inputClass} value={form.telefone_entrega} onChange={(e) => update('telefone_entrega', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">CEP</label>
              <div className="flex gap-2">
                <input required className={inputClass} value={form.cep} onChange={(e) => update('cep', e.target.value)} onBlur={() => form.cep && buscarCep()} />
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
              <input className={inputClass} value={form.bairro} onChange={(e) => update('bairro', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cidade</label>
              <input required className={inputClass} value={form.cidade} onChange={(e) => update('cidade', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <input required maxLength={2} className={inputClass} value={form.estado} onChange={(e) => update('estado', e.target.value.toUpperCase())} />
            </div>
          </div>
        </section>

        {freteOpcoes.length > 0 ? (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">Frete</h2>
            <div className="space-y-2">
              {freteOpcoes.map((op) => (
                <label key={op.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <span>
                    <input
                      type="radio"
                      name="frete"
                      checked={freteSelecionado?.id === op.id}
                      onChange={() => setFreteSelecionado(op)}
                      className="mr-2"
                    />
                    {op.nome} — {op.prazo}
                  </span>
                  <span className="font-semibold">{BRL.format(op.valor)}</span>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Pagamento</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="metodo"
                value="pix"
                checked={metodo === 'pix'}
                onChange={() => setMetodo('pix')}
                data-testid={testIds.checkoutPayment('pix')}
              />
              PIX
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="metodo"
                value="boleto"
                checked={metodo === 'boleto'}
                onChange={() => setMetodo('boleto')}
                data-testid={testIds.checkoutPayment('boleto')}
              />
              Boleto
            </label>
            {preview.sumup_habilitado ? (
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="metodo"
                  value="sumup_online"
                  checked={metodo === 'sumup_online'}
                  onChange={() => setMetodo('sumup_online')}
                  data-testid={testIds.checkoutPayment('sumup_online')}
                />
                SumUp
              </label>
            ) : null}
            {IS_DEV ? (
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="metodo"
                  value="teste"
                  checked={metodo === 'teste'}
                  onChange={() => setMetodo('teste')}
                  data-testid={testIds.checkoutPaymentTeste}
                />
                Pagamento teste (dev)
              </label>
            ) : null}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Resumo</h2>
        <ul className="mb-4 space-y-2 text-sm text-gray-600">
          {preview.itens.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {item.quantidade}x {item.nome}
              </span>
              <span>{BRL.format(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between border-t pt-3 text-base font-bold">
          <span>Total</span>
          <span>{BRL.format(totalComFrete)}</span>
        </p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          data-testid={testIds.checkoutSubmitBtn}
          className="btn-primary mt-6 w-full py-3"
        >
          {submitting ? 'Processando…' : 'Finalizar pedido'}
        </button>
      </aside>
    </form>
  );
}
