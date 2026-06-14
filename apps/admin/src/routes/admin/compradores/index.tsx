import { Button, Card, Table, cn } from '@lojao/ui';
import { testIds } from '@lojao/test-utils';
import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { apiFetch } from '../../../lib/api-client';
import { formatBRL } from '../../../lib/currency';

interface Comprador {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  cidade: string | null;
  estado: string | null;
  ativo: boolean;
  created_at: string;
  total_pedidos: number;
  total_gasto: number;
}

interface CompradoresResponse {
  data: Comprador[];
  meta: {
    totais: {
      total_compradores: number;
      ativos: number;
      novos_mes: number;
    };
    busca: string;
  };
}

function fetchCompradores(busca: string) {
  const qs = busca ? `?busca=${encodeURIComponent(busca)}` : '';
  return apiFetch<CompradoresResponse>(`/api/v1/admin/compradores${qs}`);
}

export function CompradoresPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const buscaAtiva = searchParams.get('busca') ?? '';
  const [buscaInput, setBuscaInput] = useState(buscaAtiva);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'compradores', buscaAtiva],
    queryFn: () => fetchCompradores(buscaAtiva),
  });

  const compradores = data?.data ?? [];
  const totais = data?.meta.totais;

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = buscaInput.trim();
    if (trimmed) {
      setSearchParams({ busca: trimmed });
    } else {
      setSearchParams({});
    }
  }

  function handleClearSearch() {
    setBuscaInput('');
    setSearchParams({});
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Compradores</h1>
      <p className="mb-6 text-sm text-gray-400">
        Fichas de todos os clientes que realizaram cadastro na loja.
      </p>

      {totais && (
        <div
          data-testid={testIds.adminCompradores.stats}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <Card>
            <div className="text-xs text-gray-500">Total de compradores</div>
            <div className="mt-1 text-3xl font-bold text-white">{totais.total_compradores}</div>
          </Card>
          <Card>
            <div className="text-xs text-gray-500">Contas ativas</div>
            <div className="mt-1 text-3xl font-bold text-green-400">{totais.ativos}</div>
          </Card>
          <Card>
            <div className="text-xs text-gray-500">Novos este mês</div>
            <div className="mt-1 text-3xl font-bold text-blue-400">{totais.novos_mes}</div>
          </Card>
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={buscaInput}
          onChange={(e) => setBuscaInput(e.target.value)}
          placeholder="Buscar por nome, e-mail, CPF ou telefone..."
          data-testid={testIds.adminCompradores.searchInput}
          className="min-w-0 flex-1 rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
        />
        <Button type="submit" data-testid={testIds.adminCompradores.searchBtn}>
          Buscar
        </Button>
        {buscaAtiva && (
          <Button
            type="button"
            variant="secondary"
            data-testid={testIds.adminCompradores.searchClearBtn}
            onClick={handleClearSearch}
          >
            Limpar
          </Button>
        )}
      </form>

      {isError && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300">
          Não foi possível carregar os compradores.
        </p>
      )}

      {isLoading ? (
        <Card className="text-center text-gray-400">Carregando compradores…</Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <div className="border-b border-gray-800 px-6 py-4">
            <h2 className="font-semibold text-white">
              {compradores.length} comprador{compradores.length !== 1 ? 'es' : ''}
              {buscaAtiva && (
                <span className="font-normal text-gray-500"> para &quot;{buscaAtiva}&quot;</span>
              )}
            </h2>
          </div>

          {compradores.length === 0 ? (
            <div
              data-testid={testIds.adminCompradores.emptyState}
              className="py-16 text-center text-gray-400"
            >
              <p className="font-medium">Nenhum comprador encontrado</p>
              <p className="mt-1 text-sm text-gray-600">
                {buscaAtiva
                  ? 'Tente uma busca diferente'
                  : 'Os compradores aparecem aqui quando fazem cadastro na loja'}
              </p>
            </div>
          ) : (
            <Table data-testid={testIds.adminCompradores.table}>
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 text-left">Comprador</th>
                  <th className="px-4 py-3 text-left">Telefone</th>
                  <th className="px-4 py-3 text-left">Cidade/UF</th>
                  <th className="px-4 py-3 text-center">Pedidos</th>
                  <th className="px-4 py-3 text-right">Total gasto</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Cadastro</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {compradores.map((c) => (
                  <tr
                    key={c.id}
                    data-testid={testIds.adminCompradores.row(c.id)}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{c.nome}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{c.email}</div>
                      {c.cpf && <div className="mt-0.5 text-xs text-gray-600">CPF: {c.cpf}</div>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">{c.telefone ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {c.cidade ? `${c.cidade}/${c.estado}` : '—'}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-semibold text-white">
                      {c.total_pedidos}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-green-400">
                      {formatBRL(c.total_gasto)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-xs font-medium',
                          c.ativo
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-red-900/50 text-red-400',
                        )}
                      >
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        to={`/admin/compradores/${c.id}`}
                        data-testid={testIds.adminCompradores.detailBtn(c.id)}
                        className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs transition hover:bg-gray-700"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
