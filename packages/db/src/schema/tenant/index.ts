import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('usuario'),
  telefone: varchar('telefone', { length: 20 }),
  cpf: varchar('cpf', { length: 14 }),
  cep: varchar('cep', { length: 9 }),
  logradouro: varchar('logradouro', { length: 255 }),
  numero: varchar('numero', { length: 20 }),
  complemento: varchar('complemento', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }),
  cidade: varchar('cidade', { length: 100 }),
  estado: varchar('estado', { length: 2 }),
  ativo: boolean('ativo').default(true),
  tentativasFalha: integer('tentativas_falha').default(0),
  bloqueadoAte: timestamp('bloqueado_ate'),
  ultimoAcesso: timestamp('ultimo_acesso'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tentativasLogin = pgTable('tentativas_login', {
  id: serial('id').primaryKey(),
  ip: varchar('ip', { length: 45 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  tentativas: integer('tentativas').default(0),
  bloqueadoAte: timestamp('bloqueado_ate'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tokensRecuperacao = pgTable('tokens_recuperacao', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  canal: varchar('canal', { length: 10 }).default('email'),
  usado: boolean('usado').default(false),
  expiraEm: timestamp('expira_em').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categorias = pgTable('categorias', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  ordem: integer('ordem').default(0),
  ativo: boolean('ativo').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const produtos = pgTable('produtos', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  subtitulo: varchar('subtitulo', { length: 255 }),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull().default('0'),
  descricao: text('descricao'),
  estoque: integer('estoque'),
  categoriaId: integer('categoria_id').references(() => categorias.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const produtosImagens = pgTable('produtos_imagens', {
  id: serial('id').primaryKey(),
  produtoId: integer('produto_id')
    .references(() => produtos.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const configuracoes = pgTable('configuracoes', {
  chave: varchar('chave', { length: 100 }).primaryKey(),
  valor: text('valor'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  subtitulo: varchar('subtitulo', { length: 500 }),
  imagem: varchar('imagem', { length: 500 }).notNull(),
  ctaTexto: varchar('cta_texto', { length: 100 }).default('Ver oferta'),
  ctaUrl: varchar('cta_url', { length: 500 }),
  produtoId: integer('produto_id').references(() => produtos.id, { onDelete: 'set null' }),
  ativo: boolean('ativo').default(true),
  ordem: integer('ordem').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const pedidos = pgTable('pedidos', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  nomeEntrega: varchar('nome_entrega', { length: 255 }).notNull(),
  emailEntrega: varchar('email_entrega', { length: 255 }).notNull(),
  telefoneEntrega: varchar('telefone_entrega', { length: 20 }),
  cpfEntrega: varchar('cpf_entrega', { length: 14 }),
  cep: varchar('cep', { length: 9 }),
  logradouro: varchar('logradouro', { length: 255 }),
  numero: varchar('numero', { length: 20 }),
  complemento: varchar('complemento', { length: 100 }),
  bairro: varchar('bairro', { length: 100 }),
  cidade: varchar('cidade', { length: 100 }),
  estado: varchar('estado', { length: 2 }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  frete: numeric('frete', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('aguardando_pagamento'),
  metodoPagamento: varchar('metodo_pagamento', { length: 20 }),
  mpPaymentId: varchar('mp_payment_id', { length: 100 }),
  dataEvento: date('data_evento'),
  codigoRastreio: varchar('codigo_rastreio', { length: 100 }),
  freteServico: varchar('frete_servico', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const pedidoItens = pgTable('pedido_itens', {
  id: serial('id').primaryKey(),
  pedidoId: integer('pedido_id')
    .notNull()
    .references(() => pedidos.id, { onDelete: 'cascade' }),
  produtoId: integer('produto_id').references(() => produtos.id, { onDelete: 'set null' }),
  nomeProduto: varchar('nome_produto', { length: 255 }).notNull(),
  quantidade: integer('quantidade').notNull(),
  precoUnitario: numeric('preco_unitario', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
});

export const pagamentos = pgTable('pagamentos', {
  id: serial('id').primaryKey(),
  pedidoId: integer('pedido_id')
    .notNull()
    .references(() => pedidos.id, { onDelete: 'cascade' }),
  mpPaymentId: varchar('mp_payment_id', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('pendente'),
  statusMp: varchar('status_mp', { length: 30 }),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
  metodo: varchar('metodo', { length: 20 }),
  respostaJson: text('resposta_json'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const carrinhoItens = pgTable(
  'carrinho_itens',
  {
    id: serial('id').primaryKey(),
    usuarioId: integer('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    produtoId: integer('produto_id')
      .notNull()
      .references(() => produtos.id, { onDelete: 'cascade' }),
    quantidade: integer('quantidade').notNull().default(1),
    precoUnitario: numeric('preco_unitario', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique().on(t.usuarioId, t.produtoId)],
);

export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 255 }).notNull(),
  logo: varchar('logo', { length: 500 }),
  website: varchar('website', { length: 255 }),
  ordem: integer('ordem').default(0),
  ativo: boolean('ativo').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditoria = pgTable('auditoria', {
  id: serial('id').primaryKey(),
  tabela: varchar('tabela', { length: 100 }).notNull(),
  registroId: integer('registro_id'),
  acao: varchar('acao', { length: 10 }).notNull(),
  dadosAntigos: jsonb('dados_antigos'),
  dadosNovos: jsonb('dados_novos'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const movimentacoesEstoque = pgTable('movimentacoes_estoque', {
  id: serial('id').primaryKey(),
  produtoId: integer('produto_id')
    .notNull()
    .references(() => produtos.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 20 }).notNull(),
  quantidade: integer('quantidade').notNull(),
  origem: varchar('origem', { length: 30 }),
  origemId: integer('origem_id'),
  observacao: text('observacao'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const agendaConfig = pgTable('agenda_config', {
  id: integer('id').primaryKey().default(1),
  capacidadeDiaria: integer('capacidade_diaria').notNull().default(1),
  antecedenciaMinimaDias: integer('antecedencia_minima_dias').notNull().default(1),
  antecedenciaMaximaDias: integer('antecedencia_maxima_dias').notNull().default(180),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const agendaDiasEspeciais = pgTable('agenda_dias_especiais', {
  data: date('data').primaryKey(),
  capacidade: integer('capacidade'),
  motivo: varchar('motivo', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const agendamentos = pgTable('agendamentos', {
  id: serial('id').primaryKey(),
  pedidoId: integer('pedido_id')
    .notNull()
    .references(() => pedidos.id, { onDelete: 'cascade' }),
  dataEvento: date('data_evento').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('confirmado'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const conversas = pgTable('conversas', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  usuarioId: integer('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  nomeVisitante: varchar('nome_visitante', { length: 100 }).default('Visitante'),
  status: varchar('status', { length: 20 }).notNull().default('aberta'),
  botAtivo: boolean('bot_ativo').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const mensagens = pgTable('mensagens', {
  id: serial('id').primaryKey(),
  conversaId: integer('conversa_id')
    .notNull()
    .references(() => conversas.id, { onDelete: 'cascade' }),
  remetente: varchar('remetente', { length: 10 }).notNull(),
  conteudo: text('conteudo').notNull(),
  lida: boolean('lida').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const botRespostas = pgTable('bot_respostas', {
  id: serial('id').primaryKey(),
  palavraChave: varchar('palavra_chave', { length: 200 }).notNull(),
  resposta: text('resposta').notNull(),
  ordem: integer('ordem').default(0),
  ativo: boolean('ativo').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
