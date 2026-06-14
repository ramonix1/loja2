import { Button, Card } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';

import { ApiError, apiFetch, apiUpload, legacyImageUrl } from '../../../lib/api-client';

interface AparenciaConfig {
  loja_nome: string;
  loja_slogan: string;
  loja_cor_primaria: string;
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
  const [cor, setCor] = useState('#2563eb');
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
    setCor(cfg.loja_cor_primaria || '#2563eb');
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
    return <Card className="text-center text-gray-400">Carregando…</Card>;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Aparência</h1>
      <p className="mb-6 text-sm text-gray-400">Personalize a identidade visual da loja.</p>

      {saved && (
        <div
          data-testid={testIds.adminAparencia.successMsg}
          className="mb-6 rounded-xl border border-green-700 bg-green-900/50 px-4 py-3 text-sm text-green-300"
        >
          Aparência salva com sucesso.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-700 bg-red-900/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Pré-visualização do header
        </div>
        <div
          data-testid={testIds.adminAparencia.preview}
          className="flex items-center gap-3 rounded-lg bg-gray-800 px-6 py-3"
        >
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-8 object-contain" />
            ) : (
              <>
                <span className="text-gray-400">🛒</span>
                <span>{nome || 'Nome da loja'}</span>
              </>
            )}
          </div>
          <div className="ml-6 flex flex-1 gap-4 text-sm text-gray-300">
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
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-white">Informações básicas</h2>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Nome da loja</label>
              <input
                data-testid={testIds.adminAparencia.nomeInput}
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Sapataria Mario"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Slogan / descrição curta
              </label>
              <input
                data-testid={testIds.adminAparencia.sloganInput}
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: Os melhores calçados da cidade"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Texto do rodapé
              </label>
              <input
                data-testid={testIds.adminAparencia.rodapeInput}
                type="text"
                value={rodape}
                onChange={(e) => setRodape(e.target.value)}
                placeholder="© 2025 Minha Loja. Todos os direitos reservados."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold text-white">Identidade visual</h2>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Cor principal
              </label>
              <div className="flex items-center gap-3">
                <input
                  data-testid={testIds.adminAparencia.corInput}
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="h-12 w-12 cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-1"
                />
                <div>
                  <div className="text-sm font-medium text-white">{cor}</div>
                  <div className="text-xs text-gray-500">Aplicada em botões e destaques</div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Logomarca</label>
              {logoPreview && !logoFile && (
                <div className="mb-2 inline-block rounded-lg bg-gray-800 p-3">
                  <img src={logoPreview} alt="Logo atual" className="h-12 object-contain" />
                </div>
              )}
              <input
                data-testid={testIds.adminAparencia.logoInput}
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-300 hover:file:bg-gray-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Favicon</label>
              {faviconPreview && !faviconFile && (
                <div className="mb-2 flex items-center gap-2">
                  <img
                    src={faviconPreview}
                    alt="Favicon"
                    className="h-6 w-6 object-contain"
                  />
                  <span className="text-xs text-gray-500">Favicon atual</span>
                </div>
              )}
              <input
                data-testid={testIds.adminAparencia.faviconInput}
                type="file"
                accept="image/*"
                onChange={(e) => setFaviconFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-300 hover:file:bg-gray-700"
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold text-white">Informações de contato</h2>
            <p className="-mt-2 text-xs text-gray-500">Exibidas no rodapé da loja.</p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                E-mail de contato
              </label>
              <input
                data-testid={testIds.adminAparencia.emailInput}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@minhaloja.com.br"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">WhatsApp</label>
              <input
                data-testid={testIds.adminAparencia.whatsappInput}
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(00) 90000-0000"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Button
            type="submit"
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
