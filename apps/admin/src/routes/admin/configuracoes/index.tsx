import { Button, Card, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ApiError, apiFetch } from '../../../lib/api-client';

interface ConfiguracoesConfig {
  controla_estoque: boolean;
  reservar_estoque_carrinho: boolean;
  modulo_agenda: boolean;
  habilitar_sumup: boolean;
  frete_cep_origem: string;
  frete_fixo: number;
  frete_gratis_acima: number;
  melhor_envio_token: string;
  melhor_envio_sandbox: boolean;
  frete_peso_padrao: number;
  frete_altura: number;
  frete_largura: number;
  frete_comprimento: number;
}

function fetchConfiguracoes() {
  return apiFetch<{ data: ConfiguracoesConfig }>('/api/v1/admin/configuracoes').then((r) => r.data);
}

function ToggleRow({
  checked,
  onChange,
  testId,
  title,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  testId: string;
  title: string;
  description: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-4',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-testid={testId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition',
          checked ? 'bg-blue-600' : 'bg-gray-700',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition',
            checked && 'translate-x-5',
          )}
        />
      </button>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-0.5 text-xs text-gray-400">{description}</div>
      </div>
    </label>
  );
}

export function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ConfiguracoesConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'configuracoes'],
    queryFn: fetchConfiguracoes,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: ConfiguracoesConfig) =>
      apiFetch<{ data: ConfiguracoesConfig }>('/api/v1/admin/configuracoes', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      setForm(res.data);
      setSaved(true);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'configuracoes'] });
      setTimeout(() => setSaved(false), 4000);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar configurações.');
    },
  });

  function patch<K extends keyof ConfiguracoesConfig>(key: K, value: ConfiguracoesConfig[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    saveMutation.mutate(form);
  }

  if (isLoading || !form) {
    return <Card className="text-center text-gray-400">Carregando configurações…</Card>;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Configurações</h1>
      <p className="mb-6 text-sm text-gray-400">Gerencie as opções do sistema.</p>

      {saved && (
        <p
          data-testid={testIds.adminConfiguracoes.successMsg}
          className="mb-6 rounded-xl border border-green-700 bg-green-900/50 px-4 py-3 text-sm text-green-300"
        >
          Configurações salvas com sucesso.
        </p>
      )}
      {error && (
        <p
          data-testid={testIds.adminConfiguracoes.errorMsg}
          className="mb-6 rounded-xl border border-red-700 bg-red-900/50 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <form
        data-testid={testIds.adminConfiguracoes.form}
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-6"
      >
        <Card>
          <h2 className="mb-1 text-lg font-bold text-white">Controle de estoque</h2>
          <p className="mb-5 text-sm text-gray-400">
            Configure como o estoque dos produtos será gerenciado.
          </p>
          <div className="space-y-5">
            <ToggleRow
              checked={form.controla_estoque}
              onChange={(v) => patch('controla_estoque', v)}
              testId={testIds.adminConfiguracoes.controlaEstoqueInput}
              title="Ativar controle de estoque"
              description="Quando ativado, cada produto pode ter quantidade em estoque. Produtos zerados aparecem como esgotados na vitrine."
            />
            <ToggleRow
              checked={form.reservar_estoque_carrinho}
              onChange={(v) => patch('reservar_estoque_carrinho', v)}
              testId={testIds.adminConfiguracoes.reservarEstoqueInput}
              title="Reservar estoque ao adicionar ao carrinho"
              description="Ativado: bloqueia unidades no carrinho. Desativado: debita só no pagamento."
              disabled={!form.controla_estoque}
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-bold text-white">SumUp</h2>
          <p className="mb-5 text-sm text-gray-400">
            Requer <code className="rounded bg-gray-800 px-1 text-xs">SUMUP_API_KEY</code> e{' '}
            <code className="rounded bg-gray-800 px-1 text-xs">SUMUP_MERCHANT_CODE</code> no
            servidor.
          </p>
          <ToggleRow
            checked={form.habilitar_sumup}
            onChange={(v) => patch('habilitar_sumup', v)}
            testId={testIds.adminConfiguracoes.habilitarSumupInput}
            title="Exibir opção de pagamento via SumUp no checkout"
            description="Quando desativado, SumUp não aparece para o cliente mesmo com credenciais configuradas."
          />
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-bold text-white">Frete</h2>
          <p className="mb-5 text-sm text-gray-400">
            Configure frete fixo, grátis ou cálculo via Melhor Envio.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="frete-cep" className="mb-1.5 block text-sm font-medium text-gray-300">
                  CEP de origem (da loja)
                </label>
                <input
                  id="frete-cep"
                  type="text"
                  value={form.frete_cep_origem}
                  onChange={(e) => patch('frete_cep_origem', e.target.value)}
                  data-testid={testIds.adminConfiguracoes.freteCepInput}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="frete-fixo" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Frete fixo (R$)
                </label>
                <input
                  id="frete-fixo"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.frete_fixo}
                  onChange={(e) => patch('frete_fixo', Number(e.target.value))}
                  data-testid={testIds.adminConfiguracoes.freteFixoInput}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="frete-gratis" className="mb-1.5 block text-sm font-medium text-gray-300">
                Frete grátis acima de (R$)
              </label>
              <input
                id="frete-gratis"
                type="number"
                min={0}
                step={0.01}
                value={form.frete_gratis_acima}
                onChange={(e) => patch('frete_gratis_acima', Number(e.target.value))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h3 className="mb-3 text-sm font-bold text-gray-200">Melhor Envio (opcional)</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="me-token" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Token da API Melhor Envio
                  </label>
                  <input
                    id="me-token"
                    type="text"
                    value={form.melhor_envio_token}
                    onChange={(e) => patch('melhor_envio_token', e.target.value)}
                    data-testid={testIds.adminConfiguracoes.melhorEnvioTokenInput}
                    placeholder="eyJ0eXAiOiJKV1QiLCJhbGci..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <ToggleRow
                  checked={form.melhor_envio_sandbox}
                  onChange={(v) => patch('melhor_envio_sandbox', v)}
                  testId={testIds.adminConfiguracoes.melhorEnvioSandboxInput}
                  title="Usar ambiente sandbox (teste)"
                  description="Desative quando for para produção."
                />
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h3 className="mb-3 text-sm font-bold text-gray-200">
                Dimensões e peso padrão do pacote
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ['frete_peso_padrao', 'Peso (g)'],
                    ['frete_altura', 'Altura (cm)'],
                    ['frete_largura', 'Largura (cm)'],
                    ['frete_comprimento', 'Comprimento (cm)'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-gray-400">{label}</label>
                    <input
                      type="number"
                      min={key === 'frete_peso_padrao' ? 1 : 0.1}
                      step={key === 'frete_peso_padrao' ? 1 : 0.1}
                      value={form[key]}
                      onChange={(e) => patch(key, Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-bold text-white">Módulo Agenda (Buffet)</h2>
          <p className="mb-5 text-sm text-gray-400">
            Quando ativado, o cliente escolhe data de evento no checkout. Configure vagas em{' '}
            <Link to="/admin/agenda" className="text-blue-400 hover:underline">
              Agenda
            </Link>
            .
          </p>
          <ToggleRow
            checked={form.modulo_agenda}
            onChange={(v) => patch('modulo_agenda', v)}
            testId={testIds.adminConfiguracoes.moduloAgendaInput}
            title="Ativar módulo de agendamento"
            description="Exibe calendário no checkout e bloqueia compra sem vagas no dia escolhido."
          />
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            data-testid={testIds.adminConfiguracoes.formSubmit}
            disabled={saveMutation.isPending}
          >
            Salvar configurações
          </Button>
          <Link
            to="/admin/diagnostico"
            className="text-sm text-gray-400 transition hover:text-white"
          >
            Diagnóstico de pagamentos →
          </Link>
        </div>
      </form>
    </div>
  );
}
