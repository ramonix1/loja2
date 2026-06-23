import {
  Button,
  Card,
  Switch,
  FieldInput,
  adminFieldLabelClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
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
    <div className={cn('flex items-start gap-4', disabled && 'opacity-40')}>
      <Switch
        label={title}
        checked={checked}
        onChange={onChange}
        testId={testId}
        disabled={disabled}
        surface="admin"
      />
      <div>
        <div className="text-sm font-medium text-[var(--admin-text)]">{title}</div>
        <div className={cn('mt-0.5 text-xs', adminMutedClass())}>{description}</div>
      </div>
    </div>
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
    return (
      <Card surface="admin" className={cn('text-center', adminMutedClass())}>
        Carregando configurações…
      </Card>
    );
  }

  return (
    <div>
      <h1 className={adminPageTitleClass('mb-1')}>Configurações</h1>
      <p className={adminPageSubtitleClass('mb-6')}>Gerencie as opções do sistema.</p>

      {saved && (
        <p data-testid={testIds.adminConfiguracoes.successMsg} className="ds-alert-success mb-6">
          Configurações salvas com sucesso.
        </p>
      )}
      {error && (
        <p data-testid={testIds.adminConfiguracoes.errorMsg} className="ds-alert-error mb-6">
          {error}
        </p>
      )}

      <form
        data-testid={testIds.adminConfiguracoes.form}
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-6"
      >
        <Card surface="admin">
          <h2 className={adminSectionTitleClass('mb-1 text-lg')}>Controle de estoque</h2>
          <p className={cn('mb-5 text-sm', adminMutedClass())}>
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

        <Card surface="admin">
          <h2 className={adminSectionTitleClass('mb-1 text-lg')}>SumUp</h2>
          <p className={cn('mb-5 text-sm', adminMutedClass())}>
            Requer <code className="rounded bg-[var(--admin-surface-elevated)] px-1 text-xs">SUMUP_API_KEY</code> e{' '}
            <code className="rounded bg-[var(--admin-surface-elevated)] px-1 text-xs">SUMUP_MERCHANT_CODE</code> no
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

        <Card surface="admin">
          <h2 className={adminSectionTitleClass('mb-1 text-lg')}>Frete</h2>
          <p className={cn('mb-5 text-sm', adminMutedClass())}>
            Configure frete fixo, grátis ou cálculo via Melhor Envio.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="frete-cep" className={adminFieldLabelClass()}>
                  CEP de origem (da loja)
                </label>
                <FieldInput
                  id="frete-cep"
                  type="text"
                  value={form.frete_cep_origem}
                  onChange={(e) => patch('frete_cep_origem', e.target.value)}
                  data-testid={testIds.adminConfiguracoes.freteCepInput}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div>
                <label htmlFor="frete-fixo" className={adminFieldLabelClass()}>
                  Frete fixo (R$)
                </label>
                <FieldInput
                  id="frete-fixo"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.frete_fixo}
                  onChange={(e) => patch('frete_fixo', Number(e.target.value))}
                  data-testid={testIds.adminConfiguracoes.freteFixoInput}
                />
              </div>
            </div>

            <div>
              <label htmlFor="frete-gratis" className={adminFieldLabelClass()}>
                Frete grátis acima de (R$)
              </label>
              <FieldInput
                id="frete-gratis"
                type="number"
                min={0}
                step={0.01}
                value={form.frete_gratis_acima}
                onChange={(e) => patch('frete_gratis_acima', Number(e.target.value))}
              />
            </div>

            <div className="border-t border-[var(--admin-border)] pt-4">
              <h3 className={cn('mb-3 text-sm font-bold', adminMutedClass())}>Melhor Envio (opcional)</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="me-token" className={adminFieldLabelClass()}>
                    Token da API Melhor Envio
                  </label>
                  <FieldInput
                    id="me-token"
                    type="text"
                    value={form.melhor_envio_token}
                    onChange={(e) => patch('melhor_envio_token', e.target.value)}
                    data-testid={testIds.adminConfiguracoes.melhorEnvioTokenInput}
                    placeholder="eyJ0eXAiOiJKV1QiLCJhbGci..."
                    className="font-mono"
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

            <div className="border-t border-[var(--admin-border)] pt-4">
              <h3 className={cn('mb-3 text-sm font-bold', adminMutedClass())}>
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
                    <label className={cn('mb-1 block text-xs font-medium', adminSubtleClass())}>{label}</label>
                    <FieldInput
                      type="number"
                      min={key === 'frete_peso_padrao' ? 1 : 0.1}
                      step={key === 'frete_peso_padrao' ? 1 : 0.1}
                      value={form[key]}
                      onChange={(e) => patch(key, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card surface="admin">
          <h2 className={adminSectionTitleClass('mb-1 text-lg')}>Módulo Agenda (Buffet)</h2>
          <p className={cn('mb-5 text-sm', adminMutedClass())}>
            Quando ativado, o cliente escolhe data de evento no checkout. Configure vagas em{' '}
            <Link to="/admin/agenda" className="ds-link hover:underline">
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
            className={cn('ds-link text-sm', adminMutedClass())}
          >
            Diagnóstico de pagamentos →
          </Link>
        </div>
      </form>
    </div>
  );
}
