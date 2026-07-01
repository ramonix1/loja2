import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  RELATORIO_CSV_TIPOS,
  relatoriosCsvQuerySchema,
  relatoriosQuerySchema,
} from './relatorios.schema.js';
import {
  buildRelatorioCsv,
  getRelatorioDados,
  parseRelatorioDatas,
} from './relatorios.service.js';

export async function getRelatorioHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = relatoriosQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const range = parseRelatorioDatas(parsed.data);

  try {
    const dados = await getRelatorioDados(
      request.db,
      parsed.data.aba,
      range,
      parsed.data.filtro_estoque,
    );

    return reply.send({
      data: dados,
      meta: {
        aba: parsed.data.aba,
        dataInicio: range.dataInicioStr,
        dataFim: range.dataFimStr,
        filtroEstoque: parsed.data.filtro_estoque,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar relatório';
    return reply.send({
      data: { erro: message },
      meta: {
        aba: parsed.data.aba,
        dataInicio: range.dataInicioStr,
        dataFim: range.dataFimStr,
        filtroEstoque: parsed.data.filtro_estoque,
      },
    });
  }
}

export async function getRelatorioCsvHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const tipo = (request.params as { tipo: string }).tipo;
  if (!RELATORIO_CSV_TIPOS.includes(tipo as (typeof RELATORIO_CSV_TIPOS)[number])) {
    return reply.code(400).send({ error: 'Tipo de CSV inválido.', code: 'VALIDATION_ERROR' });
  }

  const parsed = relatoriosCsvQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const range = parseRelatorioDatas(parsed.data);
    const { csv, filename } = await buildRelatorioCsv(
      request.db,
      tipo as (typeof RELATORIO_CSV_TIPOS)[number],
      range,
    );

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}.csv"`)
      .send(csv);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar CSV';
    return reply.code(500).send({ error: message, code: 'INTERNAL_ERROR' });
  }
}
