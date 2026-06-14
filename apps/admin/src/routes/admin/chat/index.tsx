import { Button, Card, cn } from '@lojao/ui';
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
    return <p className="text-gray-400">Carregando chat…</p>;
  }

  return (
    <div
      className="-m-8 flex flex-col"
      style={{ height: 'calc(100vh - 0px)' }}
      data-testid={testIds.adminChat.panel}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-gray-800 px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Chat ao Vivo</h1>
          <p className="mt-0.5 text-sm text-gray-400">Atenda seus clientes em tempo real</p>
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
        <div className="flex w-72 shrink-0 flex-col border-r border-gray-800">
          <div className="border-b border-gray-800 p-3">
            <div className="flex gap-2 text-xs">
              {(['abertas', 'todas', 'encerradas'] as Filtro[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  data-testid={testIds.adminChat.filter(f)}
                  onClick={() => setFiltro(f)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 font-medium transition',
                    filtro === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white',
                  )}
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
              <div className="p-4 text-center text-sm text-gray-600">Nenhuma conversa</div>
            ) : (
              conversasFiltradas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  data-testid={testIds.adminChat.conversaItem(c.id)}
                  onClick={() => abrirConversa(c)}
                  className={cn(
                    'w-full border-b border-gray-800 p-4 text-left transition',
                    conversaAtiva?.id === c.id ? 'bg-gray-800' : 'hover:bg-gray-900',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="truncate text-sm font-medium text-white">{c.nome_visitante}</div>
                    <div className="ml-2 flex shrink-0 items-center gap-1.5">
                      {c.nao_lidas > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {c.nao_lidas}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{tempoRelativo(c.updated_at)}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'mt-1 inline-block rounded px-1.5 py-0.5 text-xs',
                      c.status === 'encerrada'
                        ? 'bg-gray-700 text-gray-400'
                        : c.bot_ativo
                          ? 'bg-green-900 text-green-400'
                          : 'bg-yellow-900 text-yellow-400',
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
                <p className="font-medium text-gray-400">Selecione uma conversa</p>
                <p className="mt-1 text-sm text-gray-600">
                  Clique em uma conversa à esquerda para visualizar
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between border-b border-gray-800 px-5 py-3">
                <div>
                  <div className="font-semibold text-white">{conversaAtiva.nome_visitante}</div>
                  <div className="mt-0.5 text-xs">
                    {conversaAtiva.status === 'encerrada' ? (
                      <span className="text-gray-500">Conversa encerrada</span>
                    ) : conversaAtiva.bot_ativo ? (
                      <span className="text-green-400">Bot respondendo</span>
                    ) : (
                      <span className="text-yellow-400">Você está respondendo</span>
                    )}
                  </div>
                </div>
                {conversaAtiva.status !== 'encerrada' && (
                  <div className="flex gap-2">
                    {conversaAtiva.bot_ativo && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="bg-yellow-600 text-xs hover:bg-yellow-500"
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
                      variant="secondary"
                      className="bg-red-700 text-xs text-white hover:bg-red-600"
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
                            'mb-1 text-xs text-gray-500',
                            isAdmin && 'text-right',
                          )}
                        >
                          {isAdmin ? 'Você' : isBot ? 'Bot' : 'Cliente'} ·{' '}
                          {formatarHora(msg.created_at)}
                        </div>
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm text-white',
                            isAdmin && 'rounded-tr-sm bg-purple-900/80',
                            isBot && 'rounded-tl-sm bg-green-950/80',
                            !isAdmin && !isBot && 'rounded-tl-sm bg-blue-950/80',
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
                className="shrink-0 border-t border-gray-800 p-4"
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
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
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
            className="flex max-h-[85vh] w-full max-w-2xl flex-col p-0"
            data-testid={testIds.adminChat.botModal}
          >
            <div className="flex items-center justify-between border-b border-gray-800 p-6">
              <div>
                <h2 className="text-lg font-bold text-white">Configuração do Bot</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Separe múltiplas palavras-chave por vírgula
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBotModalOpen(false)}
                className="text-xl text-gray-500 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 space-y-3">
                {botRespostas.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    Nenhuma resposta configurada ainda.
                  </p>
                ) : (
                  botRespostas.map((r) => (
                    <div key={r.id} className="rounded-xl bg-gray-800 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="mb-1 text-xs font-medium text-blue-400">
                            Palavras-chave:
                          </div>
                          <div className="mb-2 text-sm text-gray-200">{r.palavra_chave}</div>
                          <div className="mb-1 text-xs font-medium text-green-400">Resposta:</div>
                          <div className="text-sm text-gray-300">{r.resposta}</div>
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
                            variant="secondary"
                            className="bg-red-900 px-2 py-1 text-xs text-red-200"
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
              <div className="rounded-xl bg-gray-800 p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">
                  {botEditId ? 'Editando resposta' : '+ Nova resposta automática'}
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={botKw}
                    placeholder="ex: preço, valor, quanto custa"
                    onChange={(e) => setBotKw(e.target.value)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                  <textarea
                    rows={3}
                    value={botResp}
                    placeholder="Digite a resposta automática..."
                    onChange={(e) => setBotResp(e.target.value)}
                    className="w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
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
