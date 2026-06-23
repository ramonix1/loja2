import {
  Button,
  Card,
  adminInputClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminPeriodPillClass,
  adminSectionTitleClass,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { apiFetch } from '../../../lib/api-client';
import { createChatSocket } from '../../../lib/chat-socket';

interface Conversa {
  id: number;
  nome_visitante: string;
  status: 'aberta' | 'encerrada';
  bot_ativo: boolean;
  updated_at: string;
  nao_lidas: number;
}

interface Mensagem {
  id: number;
  conversa_id: number;
  remetente: 'cliente' | 'bot' | 'admin';
  conteudo: string;
  created_at: string;
}

interface BotResposta {
  id: number;
  palavra_chave: string;
  resposta: string;
}

type Filtro = 'abertas' | 'todas' | 'encerradas';

function fetchConversas() {
  return apiFetch<{ data: Conversa[] }>('/api/v1/admin/chat/conversas').then((r) => r.data);
}

function fetchMensagens(conversaId: number) {
  return apiFetch<{ data: Mensagem[] }>(`/api/v1/admin/chat/conversas/${conversaId}/mensagens`).then(
    (r) => r.data,
  );
}

function fetchBotRespostas() {
  return apiFetch<{ data: BotResposta[] }>('/api/v1/admin/chat/bot-respostas').then((r) => r.data);
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarHora(ts: string): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function tempoRelativo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function ChatPage() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<Filtro>('abertas');
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null);
  const [mensagemInput, setMensagemInput] = useState('');
  const [botModalOpen, setBotModalOpen] = useState(false);
  const [botEditId, setBotEditId] = useState<number | null>(null);
  const [botKw, setBotKw] = useState('');
  const [botResp, setBotResp] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);

  const { data: conversas = [], isLoading } = useQuery({
    queryKey: ['admin', 'chat', 'conversas'],
    queryFn: fetchConversas,
    refetchInterval: 30_000,
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['admin', 'chat', 'mensagens', conversaAtiva?.id],
    queryFn: () => fetchMensagens(conversaAtiva!.id),
    enabled: conversaAtiva != null,
  });

  const { data: botRespostas = [] } = useQuery({
    queryKey: ['admin', 'chat', 'bot-respostas'],
    queryFn: fetchBotRespostas,
    enabled: botModalOpen,
  });

  const invalidateConversas = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'conversas'] }),
    [queryClient],
  );

  useEffect(() => {
    const socket = createChatSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('admin:entrar');
    });

    socket.on('admin:nova_conversa', () => {
      invalidateConversas();
    });

    socket.on('admin:nova_mensagem', ({ conversa_id, mensagem }: { conversa_id: number; mensagem: Mensagem }) => {
      if (conversaAtiva?.id === conversa_id) {
        queryClient.setQueryData<Mensagem[]>(
          ['admin', 'chat', 'mensagens', conversa_id],
          (prev) => [...(prev ?? []), mensagem],
        );
      }
      invalidateConversas();
    });

    socket.on(
      'admin:conversa_atualizada',
      ({
        conversa_id,
        bot_ativo,
        status,
      }: {
        conversa_id: number;
        bot_ativo?: boolean;
        status?: string;
      }) => {
        setConversaAtiva((prev) => {
          if (prev?.id !== conversa_id) return prev;
          return {
            ...prev,
            bot_ativo: bot_ativo ?? prev.bot_ativo,
            status: (status as Conversa['status']) ?? prev.status,
          };
        });
        invalidateConversas();
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversaAtiva?.id, invalidateConversas, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const conversasFiltradas = useMemo(() => {
    return conversas.filter((c) => {
      if (filtro === 'abertas') return c.status === 'aberta';
      if (filtro === 'encerradas') return c.status === 'encerrada';
      return true;
    });
  }, [conversas, filtro]);

  function abrirConversa(conversa: Conversa) {
    if (conversaAtiva?.id !== conversa.id) {
      socketRef.current?.emit('conversa:entrar', conversa.id);
    }
    setConversaAtiva(conversa);
    setMensagemInput('');
  }

  function enviarMensagem(e?: FormEvent) {
    e?.preventDefault();
    if (!conversaAtiva || conversaAtiva.status === 'encerrada') return;
    const conteudo = mensagemInput.trim();
    if (!conteudo) return;
    socketRef.current?.emit('conversa:mensagem_admin', {
      conversa_id: conversaAtiva.id,
      conteudo,
    });
    setMensagemInput('');
  }

  function assumirConversa() {
    if (!conversaAtiva) return;
    socketRef.current?.emit('conversa:assumir', conversaAtiva.id);
    setConversaAtiva({ ...conversaAtiva, bot_ativo: false });
  }

  function liberarBot() {
    if (!conversaAtiva) return;
    socketRef.current?.emit('conversa:liberar_bot', conversaAtiva.id);
    setConversaAtiva({ ...conversaAtiva, bot_ativo: true });
  }

  function encerrarConversa() {
    if (!conversaAtiva) return;
    if (!window.confirm('Encerrar esta conversa?')) return;
    socketRef.current?.emit('conversa:encerrar', conversaAtiva.id);
  }

  const botMutation = useMutation({
    mutationFn: async () => {
      const body = { palavra_chave: botKw.trim(), resposta: botResp.trim() };
      if (botEditId) {
        return apiFetch(`/api/v1/admin/chat/bot-respostas/${botEditId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      }
      return apiFetch('/api/v1/admin/chat/bot-respostas', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      setBotEditId(null);
      setBotKw('');
      setBotResp('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'bot-respostas'] });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/admin/chat/bot-respostas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'bot-respostas'] });
    },
  });

  const inputDisabled = !conversaAtiva || conversaAtiva.status === 'encerrada';

  if (isLoading) {
    return <p className={adminMutedClass()}>Carregando chat…</p>;
  }

  return (
    <div
      className="-m-8 flex flex-col"
      style={{ height: 'calc(100vh - 0px)' }}
      data-testid={testIds.adminChat.panel}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--admin-border)] px-8 py-5">
        <div>
          <h1 className={adminPageTitleClass()}>Chat ao Vivo</h1>
          <p className={adminPageSubtitleClass('mt-0.5')}>Atenda seus clientes em tempo real</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          data-testid={testIds.adminChat.botConfigBtn}
          onClick={() => setBotModalOpen(true)}
        >
          Configurar Bot
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-72 shrink-0 flex-col border-r border-[var(--admin-border)]">
          <div className="border-b border-[var(--admin-border)] p-3">
            <div className="flex gap-2 text-xs">
              {(['abertas', 'todas', 'encerradas'] as Filtro[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  data-testid={testIds.adminChat.filter(f)}
                  onClick={() => setFiltro(f)}
                  className={adminPeriodPillClass(filtro === f, 'rounded-lg px-3 py-1.5 font-medium')}
                >
                  {f === 'abertas' ? 'Abertas' : f === 'todas' ? 'Todas' : 'Encerradas'}
                </button>
              ))}
            </div>
          </div>
          <div
            className="flex-1 overflow-y-auto"
            data-testid={testIds.adminChat.conversasList}
          >
            {conversasFiltradas.length === 0 ? (
              <div className={cn('p-4 text-center text-sm', adminSubtleClass())}>Nenhuma conversa</div>
            ) : (
              conversasFiltradas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  data-testid={testIds.adminChat.conversaItem(c.id)}
                  onClick={() => abrirConversa(c)}
                  className={cn(
                    'w-full border-b border-[var(--admin-border)] p-4 text-left transition',
                    conversaAtiva?.id === c.id
                      ? 'bg-[var(--admin-surface-elevated)]'
                      : 'hover:bg-[var(--admin-table-row-hover)]',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="truncate text-sm font-medium text-[var(--admin-text)]">
                      {c.nome_visitante}
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-1.5">
                      {c.nao_lidas > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--admin-accent)] text-xs font-bold text-[var(--admin-text)]">
                          {c.nao_lidas}
                        </span>
                      )}
                      <span className={cn('text-xs', adminSubtleClass())}>
                        {tempoRelativo(c.updated_at)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'mt-1 inline-block rounded px-1.5 py-0.5 text-xs',
                      c.status === 'encerrada'
                        ? 'bg-[var(--admin-badge-neutral-bg)] text-[var(--admin-badge-neutral-text)]'
                        : c.bot_ativo
                          ? 'bg-[var(--admin-success-bg)] text-[var(--admin-success-text)]'
                          : 'bg-[var(--admin-warning-bg)] text-[var(--admin-warning-text)]',
                    )}
                  >
                    {c.status === 'encerrada' ? 'Encerrada' : c.bot_ativo ? 'Bot' : 'Humano'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {!conversaAtiva ? (
            <div
              className="flex flex-1 items-center justify-center text-center"
              data-testid={testIds.adminChat.emptyState}
            >
              <div>
                <p className={cn('font-medium', adminMutedClass())}>Selecione uma conversa</p>
                <p className={cn('mt-1 text-sm', adminSubtleClass())}>
                  Clique em uma conversa à esquerda para visualizar
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--admin-border)] px-5 py-3">
                <div>
                  <div className="font-semibold text-[var(--admin-text)]">{conversaAtiva.nome_visitante}</div>
                  <div className="mt-0.5 text-xs">
                    {conversaAtiva.status === 'encerrada' ? (
                      <span className={adminSubtleClass()}>Conversa encerrada</span>
                    ) : conversaAtiva.bot_ativo ? (
                      <span className="text-[var(--admin-success-text)]">Bot respondendo</span>
                    ) : (
                      <span className="text-[var(--admin-warning-text)]">Você está respondendo</span>
                    )}
                  </div>
                </div>
                {conversaAtiva.status !== 'encerrada' && (
                  <div className="flex gap-2">
                    {conversaAtiva.bot_ativo && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs"
                        data-testid={testIds.adminChat.assumirBtn}
                        onClick={assumirConversa}
                      >
                        Assumir conversa
                      </Button>
                    )}
                    {!conversaAtiva.bot_ativo && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs"
                        data-testid={testIds.adminChat.liberarBotBtn}
                        onClick={liberarBot}
                      >
                        Ativar bot
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-[var(--admin-error-text)] hover:bg-[var(--admin-error-bg)]"
                      data-testid={testIds.adminChat.encerrarBtn}
                      onClick={encerrarConversa}
                    >
                      Encerrar
                    </Button>
                  </div>
                )}
              </div>

              <div
                className="flex-1 space-y-3 overflow-y-auto p-5"
                data-testid={testIds.adminChat.messages}
              >
                {mensagens.map((msg) => {
                  const isAdmin = msg.remetente === 'admin';
                  const isBot = msg.remetente === 'bot';
                  return (
                    <div key={msg.id} className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
                      <div className="max-w-xs lg:max-w-md">
                        <div
                          className={cn(
                            'mb-1 text-xs',
                            adminSubtleClass(),
                            isAdmin && 'text-right',
                          )}
                        >
                          {isAdmin ? 'Você' : isBot ? 'Bot' : 'Cliente'} ·{' '}
                          {formatarHora(msg.created_at)}
                        </div>
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm text-[var(--admin-text)]',
                            isAdmin && 'rounded-tr-sm bg-[var(--admin-accent)]/80',
                            isBot && 'rounded-tl-sm bg-[var(--admin-success-bg)]',
                            !isAdmin && !isBot && 'rounded-tl-sm bg-[var(--admin-surface-elevated)]',
                          )}
                          dangerouslySetInnerHTML={{ __html: escHtml(msg.conteudo) }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form
                className="shrink-0 border-t border-[var(--admin-border)] p-4"
                onSubmit={enviarMensagem}
              >
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={mensagemInput}
                    disabled={inputDisabled}
                    placeholder={
                      inputDisabled ? 'Conversa encerrada' : 'Digite sua resposta...'
                    }
                    data-testid={testIds.adminChat.input}
                    onChange={(e) => setMensagemInput(e.target.value)}
                    className={adminInputClass('flex-1 rounded-xl disabled:opacity-50')}
                  />
                  <Button
                    type="submit"
                    disabled={inputDisabled}
                    data-testid={testIds.adminChat.sendBtn}
                  >
                    Enviar
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {botModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setBotModalOpen(false)}
        >
          <Card
            surface="admin"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col p-0"
            data-testid={testIds.adminChat.botModal}
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] p-6">
              <div>
                <h2 className={adminSectionTitleClass('text-lg')}>Configuração do Bot</h2>
                <p className={cn('mt-0.5 text-xs', adminMutedClass())}>
                  Separe múltiplas palavras-chave por vírgula
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBotModalOpen(false)}
                className={cn('text-xl hover:text-[var(--admin-text)]', adminSubtleClass())}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 space-y-3">
                {botRespostas.length === 0 ? (
                  <p className={cn('py-4 text-center text-sm', adminSubtleClass())}>
                    Nenhuma resposta configurada ainda.
                  </p>
                ) : (
                  botRespostas.map((r) => (
                    <div key={r.id} className="rounded-xl bg-[var(--admin-surface-elevated)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="mb-1 text-xs font-medium text-[var(--admin-accent)]">
                            Palavras-chave:
                          </div>
                          <div className="mb-2 text-sm text-[var(--admin-text-muted)]">{r.palavra_chave}</div>
                          <div className="mb-1 text-xs font-medium text-[var(--admin-success-text)]">
                            Resposta:
                          </div>
                          <div className={cn('text-sm', adminMutedClass())}>{r.resposta}</div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-2 py-1 text-xs"
                            onClick={() => {
                              setBotEditId(r.id);
                              setBotKw(r.palavra_chave);
                              setBotResp(r.resposta);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs text-[var(--admin-error-text)] hover:bg-[var(--admin-error-bg)]"
                            onClick={() => {
                              if (window.confirm('Excluir esta resposta automática?')) {
                                deleteBotMutation.mutate(r.id);
                              }
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="rounded-xl bg-[var(--admin-surface-elevated)] p-4">
                <h3 className={adminSectionTitleClass('mb-3 text-sm')}>
                  {botEditId ? 'Editando resposta' : '+ Nova resposta automática'}
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={botKw}
                    placeholder="ex: preço, valor, quanto custa"
                    onChange={(e) => setBotKw(e.target.value)}
                    className={adminInputClass()}
                  />
                  <textarea
                    rows={3}
                    value={botResp}
                    placeholder="Digite a resposta automática..."
                    onChange={(e) => setBotResp(e.target.value)}
                    className={adminInputClass('resize-none')}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={botMutation.isPending || !botKw.trim() || !botResp.trim()}
                      data-testid={testIds.adminChat.botSaveBtn}
                      onClick={() => botMutation.mutate()}
                    >
                      Salvar
                    </Button>
                    {botEditId && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setBotEditId(null);
                          setBotKw('');
                          setBotResp('');
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
