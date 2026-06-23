'use client';

import { buildStorePath } from '@lojao/tenant-host';
import { store as testIds } from '@lojao/test-utils/test-ids/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

import { Button, FieldInput } from '@lojao/ui';
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
import {
  storeErrorTextClass,
  storeHeadingClass,
  storeLabelClass,
  storeLinkClass,
  storeMutedClass,
  storeOptionRowClass,
  storePanelClass,
} from '@/lib/store-styles';
import { useStoreSlug } from '@/lib/store-slug-context';
import { useStoreHref, useStoreLoginHref } from '@/lib/use-store-href';

export function CheckoutForm() {
  const router = useRouter();
  const slug = useStoreSlug();
  const loginHref = useStoreLoginHref('/checkout');
  const carrinhoHref = useStoreHref('/carrinho');
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
        router.push(loginHref);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, loginHref]);

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

      router.push(buildStorePath(slug, `/checkout/resultado/${result.pedido_id}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao finalizar pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className={storeMutedClass('text-center')}>Carregando checkout…</p>;
  if (!preview || preview.itens.length === 0) {
    return (
      <p className={storeMutedClass('text-center')}>
        Carrinho vazio.{' '}
        <Link href={carrinhoHref} className={storeLinkClass()}>
          Voltar
        </Link>
      </p>
    );
  }

  const totalComFrete = preview.subtotal + (freteSelecionado?.valor ?? 0);

  return (
    <form data-testid={testIds.checkoutForm} onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className={storePanelClass()}>
          <h2 className={storeHeadingClass('mb-4')}>Dados de entrega</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={storeLabelClass()}>Nome</label>
              <FieldInput
                surface="store"
                required
                value={form.nome_entrega}
                onChange={(e) => update('nome_entrega', e.target.value)}
              />
            </div>
            <div>
              <label className={storeLabelClass()}>E-mail</label>
              <FieldInput
                surface="store"
                required
                type="email"
                value={form.email_entrega}
                onChange={(e) => update('email_entrega', e.target.value)}
              />
            </div>
            <div>
              <label className={storeLabelClass()}>Telefone</label>
              <FieldInput
                surface="store"
                value={form.telefone_entrega}
                onChange={(e) => update('telefone_entrega', e.target.value)}
              />
            </div>
            <div>
              <label className={storeLabelClass()}>CEP</label>
              <div className="flex gap-2">
                <FieldInput
                  surface="store"
                  required
                  className="flex-1"
                  value={form.cep}
                  onChange={(e) => update('cep', e.target.value)}
                  onBlur={() => form.cep && buscarCep()}
                />
                <Button type="button" variant="secondary" surface="store" onClick={buscarCep} className="shrink-0 whitespace-nowrap px-3">
                  Buscar
                </Button>
              </div>
            </div>
            <div>
              <label className={storeLabelClass()}>Número</label>
              <FieldInput
                surface="store"
                required
                value={form.numero}
                onChange={(e) => update('numero', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={storeLabelClass()}>Logradouro</label>
              <FieldInput
                surface="store"
                required
                value={form.logradouro}
                onChange={(e) => update('logradouro', e.target.value)}
              />
            </div>
            <div>
              <label className={storeLabelClass()}>Bairro</label>
              <FieldInput
                surface="store"
                value={form.bairro}
                onChange={(e) => update('bairro', e.target.value)}
              />
            </div>
            <div>
              <label className={storeLabelClass()}>Cidade</label>
              <FieldInput
                surface="store"
                required
                value={form.cidade}
                onChange={(e) => update('cidade', e.target.value)}
              />
            </div>
            <div>
              <label className={storeLabelClass()}>Estado</label>
              <FieldInput
                surface="store"
                required
                maxLength={2}
                value={form.estado}
                onChange={(e) => update('estado', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </section>

        {freteOpcoes.length > 0 ? (
          <section className={storePanelClass()}>
            <h2 className={storeHeadingClass('mb-4')}>Frete</h2>
            <div className="space-y-2">
              {freteOpcoes.map((op) => (
                <label key={op.id} className={storeOptionRowClass()}>
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

        <section className={storePanelClass()}>
          <h2 className={storeHeadingClass('mb-4')}>Pagamento</h2>
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

      <aside className={storePanelClass('h-fit')}>
        <h2 className={storeHeadingClass('mb-4')}>Resumo</h2>
        <ul className={storeMutedClass('mb-4 space-y-2 text-sm')}>
          {preview.itens.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {item.quantidade}x {item.nome}
              </span>
              <span>{BRL.format(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between border-t border-[var(--store-border)] pt-3 text-base font-bold">
          <span>Total</span>
          <span>{BRL.format(totalComFrete)}</span>
        </p>

        {error ? <p className={storeErrorTextClass('mt-4 text-sm')}>{error}</p> : null}

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
