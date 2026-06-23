import {
  Button,
  Card,
  Switch,
  DEFAULT_LOJA_COR_PRIMARIA,
  FieldInput,
  adminFieldLabelClass,
  adminFileInputClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import type { StoreTheme } from '@lojao/types/store-theme';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';

import { ApiError, apiFetch, apiUpload, legacyImageUrl } from '../../../lib/api-client';

interface AparenciaConfig {
  loja_nome: string;
  loja_slogan: string;
  loja_cor_primaria: string;
  loja_tema: StoreTheme;
  loja_rodape: string;
  loja_email: string;
  loja_whatsapp: string;
  loja_logo: string;
  loja_favicon: string;
}

function fetchAparencia() {
  return apiFetch<{ data: AparenciaConfig }>('/api/v1/admin/aparencia').then((r) => r.data);
}

export function AparenciaPage() {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [slogan, setSlogan] = useState('');
  const [rodape, setRodape] = useState('');
  const [cor, setCor] = useState(DEFAULT_LOJA_COR_PRIMARIA);
  const [tema, setTema] = useState<StoreTheme>('escuro');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: cfg, isLoading } = useQuery({
    queryKey: ['admin', 'aparencia'],
    queryFn: fetchAparencia,
  });

  useEffect(() => {
    if (!cfg) return;
    setNome(cfg.loja_nome);
    setSlogan(cfg.loja_slogan);
    setRodape(cfg.loja_rodape);
    setCor(cfg.loja_cor_primaria || DEFAULT_LOJA_COR_PRIMARIA);
    setTema(cfg.loja_tema ?? 'escuro');
    setEmail(cfg.loja_email);
    setWhatsapp(cfg.loja_whatsapp);
    if (cfg.loja_logo) setLogoPreview(legacyImageUrl(cfg.loja_logo));
    if (cfg.loja_favicon) setFaviconPreview(legacyImageUrl(cfg.loja_favicon));
  }, [cfg]);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!faviconFile) return;
    const url = URL.createObjectURL(faviconFile);
    setFaviconPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [faviconFile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('loja_nome', nome);
      fd.append('loja_slogan', slogan);
      fd.append('loja_cor_primaria', cor);
      fd.append('loja_tema', tema);
      fd.append('loja_rodape', rodape);
      fd.append('loja_email', email);
      fd.append('loja_whatsapp', whatsapp);
      if (logoFile) fd.append('logo', logoFile);
      if (faviconFile) fd.append('favicon', faviconFile);
      return apiUpload<{ data: AparenciaConfig }>('/api/v1/admin/aparencia', fd, 'PUT');
    },
    onSuccess: (res) => {
      setSaved(true);
      setError(null);
      setLogoFile(null);
      setFaviconFile(null);
      if (res.data.loja_logo) setLogoPreview(legacyImageUrl(res.data.loja_logo));
      if (res.data.loja_favicon) setFaviconPreview(legacyImageUrl(res.data.loja_favicon));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'aparencia'] });
      setTimeout(() => setSaved(false), 4000);
    },
    onError: (err) => {
      setSaved(false);
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar aparência.');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  if (isLoading) {
    return (
      <Card surface="admin" className={cn('text-center', adminMutedClass())}>
        Carregando…
      </Card>
    );
  }

  return (
    <div>
      <h1 className={adminPageTitleClass('mb-1')}>Aparência</h1>
      <p className={adminPageSubtitleClass('mb-6')}>Personalize a identidade visual da loja.</p>

      {saved && (
        <div data-testid={testIds.adminAparencia.successMsg} className="ds-alert-success mb-6">
          Aparência salva com sucesso.
        </div>
      )}

      {error && <div className="ds-alert-error mb-6">{error}</div>}

      <div className="mb-6">
        <div className="ds-preview-label mb-2">Pré-visualização do header</div>
        <div
          data-store-theme={tema}
          data-testid={testIds.adminAparencia.preview}
          className="flex items-center gap-3 rounded-lg border border-[var(--store-border)] bg-[var(--store-header-bg)] px-6 py-3"
        >
          <div className="flex items-center gap-2 text-lg font-bold text-[var(--store-text)]">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-8 object-contain" />
            ) : (
              <>
                <span className="text-[var(--store-text-muted)]">🛒</span>
                <span>{nome || 'Nome da loja'}</span>
              </>
            )}
          </div>
          <div className={cn('ml-6 flex flex-1 gap-4 text-sm', adminMutedClass())}>
            <span>Home</span>
            <span>Pedidos</span>
          </div>
          <span
            className="rounded-md px-4 py-1.5 text-sm font-semibold text-white"
            style={{ background: cor }}
          >
            Entrar
          </span>
        </div>
      </div>

      <form data-testid={testIds.adminAparencia.form} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card surface="admin" className="space-y-4">
            <h2 className={adminSectionTitleClass()}>Informações básicas</h2>

            <div>
              <label className={adminFieldLabelClass()}>Nome da loja</label>
              <FieldInput
                data-testid={testIds.adminAparencia.nomeInput}
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Sapataria Mario"
              />
            </div>

            <div>
              <label className={adminFieldLabelClass()}>Slogan / descrição curta</label>
              <FieldInput
                data-testid={testIds.adminAparencia.sloganInput}
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: Os melhores calçados da cidade"
              />
            </div>

            <div>
              <label className={adminFieldLabelClass()}>Texto do rodapé</label>
              <FieldInput
                data-testid={testIds.adminAparencia.rodapeInput}
                type="text"
                value={rodape}
                onChange={(e) => setRodape(e.target.value)}
                placeholder="© 2025 Minha Loja. Todos os direitos reservados."
              />
            </div>
          </Card>

          <Card surface="admin" className="space-y-4">
            <h2 className={adminSectionTitleClass()}>Identidade visual</h2>

            <div>
              <label className="flex cursor-pointer items-start gap-4">
                <Switch
                  label="Vitrine com tema claro Ata Commerce"
                  checked={tema === 'claro'}
                  onChange={(checked) => setTema(checked ? 'claro' : 'escuro')}
                  testId={testIds.adminAparencia.temaSwitch}
                  disabled={saveMutation.isPending}
                  surface="admin"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--admin-text)]">Tema claro</div>
                  <div className={cn('mt-0.5 text-xs', adminMutedClass())}>
                    Paleta clara Ata Commerce na vitrine (padrão: escuro).
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label className={adminFieldLabelClass()}>Cor principal</label>
              <div className="flex items-center gap-3">
                <input
                  data-testid={testIds.adminAparencia.corInput}
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="h-12 w-12 cursor-pointer rounded-lg border border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] p-1"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--admin-text)]">{cor}</div>
                  <div className={adminSubtleClass('text-xs')}>
                    Aplicada em botões e destaques
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className={adminFieldLabelClass()}>Logomarca</label>
              {logoPreview && !logoFile && (
                <div className="mb-2 inline-block rounded-lg bg-[var(--admin-surface-elevated)] p-3">
                  <img src={logoPreview} alt="Logo atual" className="h-12 object-contain" />
                </div>
              )}
              <input
                data-testid={testIds.adminAparencia.logoInput}
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className={adminFileInputClass()}
              />
            </div>

            <div>
              <label className={adminFieldLabelClass()}>Favicon</label>
              {faviconPreview && !faviconFile && (
                <div className="mb-2 flex items-center gap-2">
                  <img src={faviconPreview} alt="Favicon" className="h-6 w-6 object-contain" />
                  <span className={adminSubtleClass('text-xs')}>Favicon atual</span>
                </div>
              )}
              <input
                data-testid={testIds.adminAparencia.faviconInput}
                type="file"
                accept="image/*"
                onChange={(e) => setFaviconFile(e.target.files?.[0] ?? null)}
                className={adminFileInputClass()}
              />
            </div>
          </Card>

          <Card surface="admin" className="space-y-4">
            <h2 className={adminSectionTitleClass()}>Informações de contato</h2>
            <p className={cn('-mt-2 text-xs', adminSubtleClass())}>Exibidas no rodapé da loja.</p>

            <div>
              <label className={adminFieldLabelClass()}>E-mail de contato</label>
              <FieldInput
                data-testid={testIds.adminAparencia.emailInput}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@minhaloja.com.br"
              />
            </div>

            <div>
              <label className={adminFieldLabelClass()}>WhatsApp</label>
              <FieldInput
                data-testid={testIds.adminAparencia.whatsappInput}
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(00) 90000-0000"
              />
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Button
            type="submit"
            surface="admin"
            data-testid={testIds.adminAparencia.formSubmit}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Salvando…' : 'Salvar aparência'}
          </Button>
        </div>
      </form>
    </div>
  );
}
