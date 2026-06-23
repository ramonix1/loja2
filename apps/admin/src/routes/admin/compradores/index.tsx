import {
  Button,
  Card,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  adminEmptyStateClass,
  adminInputClass,
  adminMutedClass,
  adminPageSubtitleClass,
  adminPageTitleClass,
  adminSectionTitleClass,
  adminStatValueClass,
  adminStatValueSuccessClass,
  StatusBadge,
  adminSubtleClass,
  cn,
} from '@lojao/ui';
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
      <h1 className={adminPageTitleClass('mb-1')}>Compradores</h1>
      <p className={adminPageSubtitleClass('mb-6')}>
        Fichas de todos os clientes que realizaram cadastro na loja.
      </p>

      {totais && (
        <div
          data-testid={testIds.adminCompradores.stats}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <Card surface="admin">
            <div className={cn('text-xs', adminSubtleClass())}>Total de compradores</div>
            <div className={adminStatValueClass()}>{totais.total_compradores}</div>
          </Card>
          <Card surface="admin">
            <div className={cn('text-xs', adminSubtleClass())}>Contas ativas</div>
            <div className={adminStatValueSuccessClass()}>{totais.ativos}</div>
          </Card>
          <Card surface="admin">
            <div className={cn('text-xs', adminSubtleClass())}>Novos este mês</div>
            <div className={cn(adminStatValueClass(), 'text-[var(--admin-accent)]')}>{totais.novos_mes}</div>
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
          className={adminInputClass('min-w-0 flex-1 rounded-xl')}
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
        <p className="ds-alert-error mb-4 text-sm">
          Não foi possível carregar os compradores.
        </p>
      )}

      {isLoading ? (
        <Card surface="admin" className={cn('text-center', adminMutedClass())}>
          Carregando compradores…
        </Card>
      ) : (
        <Card surface="admin" className="overflow-hidden p-0">
          <div className="border-b border-[var(--admin-border)] px-6 py-4">
            <h2 className={adminSectionTitleClass()}>
              {compradores.length} comprador{compradores.length !== 1 ? 'es' : ''}
              {buscaAtiva && (
                <span className={cn('font-normal', adminSubtleClass())}> para &quot;{buscaAtiva}&quot;</span>
              )}
            </h2>
          </div>

          {compradores.length === 0 ? (
            <div
              data-testid={testIds.adminCompradores.emptyState}
              className={adminEmptyStateClass('py-16')}
            >
              <p className="font-medium">Nenhum comprador encontrado</p>
              <p className={cn('mt-1 text-sm', adminSubtleClass())}>
                {buscaAtiva
                  ? 'Tente uma busca diferente'
                  : 'Os compradores aparecem aqui quando fazem cadastro na loja'}
              </p>
            </div>
          ) : (
            <Table surface="admin" data-testid={testIds.adminCompradores.table}>
              <TableHead surface="admin">
                <TableRow surface="admin">
                  <TableHeaderCell>Comprador</TableHeaderCell>
                  <TableHeaderCell>Telefone</TableHeaderCell>
                  <TableHeaderCell>Cidade/UF</TableHeaderCell>
                  <TableHeaderCell className="text-center">Pedidos</TableHeaderCell>
                  <TableHeaderCell className="text-right">Total gasto</TableHeaderCell>
                  <TableHeaderCell className="text-center">Status</TableHeaderCell>
                  <TableHeaderCell className="text-center">Cadastro</TableHeaderCell>
                  <TableHeaderCell />
                </TableRow>
              </TableHead>
              <tbody>
                {compradores.map((c) => (
                  <TableRow
                    key={c.id}
                    surface="admin"
                    data-testid={testIds.adminCompradores.row(c.id)}
                  >
                    <TableCell>
                      <div className="text-sm font-medium text-[var(--admin-text)]">{c.nome}</div>
                      <div className={cn('mt-0.5 text-xs', adminSubtleClass())}>{c.email}</div>
                      {c.cpf && (
                        <div className={cn('mt-0.5 text-xs', adminSubtleClass())}>CPF: {c.cpf}</div>
                      )}
                    </TableCell>
                    <TableCell>{c.telefone ?? '—'}</TableCell>
                    <TableCell>
                      {c.cidade ? `${c.cidade}/${c.estado}` : '—'}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {c.total_pedidos}
                    </TableCell>
                    <TableCell className={cn('text-right font-semibold', adminStatValueSuccessClass('text-base'))}>
                      {formatBRL(c.total_gasto)}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={c.ativo ? 'pago' : 'cancelado'}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className={cn('text-center text-xs', adminSubtleClass())}>
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={`/admin/compradores/${c.id}`}
                        data-testid={testIds.adminCompradores.detailBtn(c.id)}
                      >
                        <Button variant="secondary" className="text-xs">
                          Ver ficha
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
