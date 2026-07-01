import type { FastifyReply, FastifyRequest } from 'fastify';

import { UploadError } from '../../lib/image-validation.js';
import { parseMultipartAll } from '../../lib/multipart.js';
import { estoqueBodySchema, produtoFieldsSchema } from './produtos.schema.js';
import {
  createProduto,
  deleteProduto,
  deleteProdutoImagem,
  getProduto,
  listProdutos,
  updateProduto,
  updateProdutoEstoque,
} from './produtos.service.js';

function parseProdutoFields(fields: Record<string, string>) {
  const nome = fields.nome ?? fields.titulo;
  return produtoFieldsSchema.safeParse({
    nome,
    subtitulo: fields.subtitulo || null,
    valor: fields.valor,
    descricao: fields.descricao || null,
    estoque: fields.estoque ?? null,
    categoria_id: fields.categoria_id && fields.categoria_id !== '' ? fields.categoria_id : null,
  });
}

export async function listProdutosHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = await listProdutos(request.db);
  return reply.send({ data });
}

export async function getProdutoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const data = await getProduto(request.db, id);
  if (!data) {
    return reply.code(404).send({ error: 'Produto não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data });
}

export async function createProdutoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { fields, files } = await parseMultipartAll(request);
    const imagens = files.filter((f) => f.fieldname === 'imagens');
    if (imagens.length === 0) {
      return reply.code(400).send({
        error: 'Pelo menos uma imagem é obrigatória.',
        code: 'VALIDATION_ERROR',
      });
    }

    const parsed = parseProdutoFields(fields);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { id } = await createProduto(request.db, request.server.imageStorage, parsed.data, imagens);
    return reply.code(201).send({ data: { id } });
  } catch (err) {
    if (err instanceof UploadError) {
      return reply.code(400).send({ error: err.message, code: 'VALIDATION_ERROR' });
    }
    throw err;
  }
}

export async function updateProdutoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  try {
    const { fields, files } = await parseMultipartAll(request);
    const imagens = files.filter((f) => f.fieldname === 'imagens');
    const parsed = parseProdutoFields(fields);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Dados inválidos.',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const ok = await updateProduto(request.db, request.server.imageStorage, id, parsed.data, imagens);
    if (!ok) {
      return reply.code(404).send({ error: 'Produto não encontrado.', code: 'NOT_FOUND' });
    }

    return reply.send({ data: { ok: true } });
  } catch (err) {
    if (err instanceof UploadError) {
      return reply.code(400).send({ error: err.message, code: 'VALIDATION_ERROR' });
    }
    throw err;
  }
}

export async function deleteProdutoHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const ok = await deleteProduto(request.db, request.server.imageStorage, id);
  if (!ok) {
    return reply.code(404).send({ error: 'Produto não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data: { ok: true } });
}

export async function updateProdutoEstoqueHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const id = Number((request.params as { id: string }).id);
  if (!Number.isInteger(id) || id < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const parsed = estoqueBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const ok = await updateProdutoEstoque(
    request.db,
    id,
    parsed.data.estoque,
    parsed.data.observacao,
  );
  if (!ok) {
    return reply.code(404).send({ error: 'Produto não encontrado.', code: 'NOT_FOUND' });
  }

  return reply.send({ data: { ok: true } });
}

export async function deleteProdutoImagemHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const imagemId = Number((request.params as { imagemId: string }).imagemId);
  if (!Number.isInteger(imagemId) || imagemId < 1) {
    return reply.code(400).send({ error: 'ID inválido.', code: 'VALIDATION_ERROR' });
  }

  const ok = await deleteProdutoImagem(request.db, request.server.imageStorage, imagemId);
  if (!ok) {
    return reply.code(404).send({ error: 'Imagem não encontrada.', code: 'NOT_FOUND' });
  }

  return reply.send({ data: { ok: true } });
}
