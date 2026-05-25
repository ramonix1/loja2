/**
 * Dados Mock para Testes
 * Use estes dados em testes de integração e E2E
 */

const mockUsuario = {
  id: 1,
  nome: 'João Silva',
  email: 'joao@example.com',
  role: 'usuario',
  created_at: new Date('2026-01-01'),
};

const mockAdmin = {
  id: 999,
  nome: 'Admin Test',
  email: 'admin@example.com',
  role: 'admin',
  created_at: new Date('2025-01-01'),
};

const mockProduto = {
  id: 1,
  nome: 'Produto Teste',
  subtitulo: 'Um produto para testes',
  valor: 99.99,
  descricao: 'Descrição do produto teste',
  estoque: 10,
  categoria_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockPedido = {
  id: 1,
  usuario_id: 1,
  nome_entrega: 'João Silva',
  email_entrega: 'joao@example.com',
  telefone_entrega: '(11) 98765-4321',
  cpf_entrega: '12345678901',
  cep: '01310-100',
  logradouro: 'Avenida Paulista',
  numero: '1000',
  complemento: 'Apto 201',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  subtotal: 99.99,
  frete: 15.50,
  total: 115.49,
  status: 'pago',
  metodo_pagamento: 'cartao',
  created_at: new Date(),
  updated_at: new Date(),
};

const mockItemPedido = {
  id: 1,
  pedido_id: 1,
  produto_id: 1,
  nome_produto: 'Produto Teste',
  preco_unitario: 99.99,
  quantidade: 1,
  subtotal: 99.99,
};

const mockCarrinhoItem = {
  id: 1,
  usuario_id: 1,
  produto_id: 1,
  nome: 'Produto Teste',
  preco_unitario: 99.99,
  quantidade: 1,
  subtotal: 99.99,
  primeira_imagem: '/images/produto-teste.jpg',
};

const mockConfiguracao = {
  id: 1,
  chave: 'loja_nome',
  valor: 'Minha Loja Teste',
};

const mockCheckoutData = {
  nome_entrega: 'João Silva',
  email_entrega: 'joao@example.com',
  telefone_entrega: '(11) 98765-4321',
  cpf_entrega: '12345678901',
  cep: '01310-100',
  logradouro: 'Avenida Paulista',
  numero: '1000',
  complemento: 'Apto 201',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  metodo_pagamento: 'cartao',
  frete_valor: '15.50',
  frete_servico: 'PAC',
};

const mockSession = {
  usuarioId: 1,
  nome: 'João Silva',
  email: 'joao@example.com',
  role: 'usuario',
  tenantSlug: 'vitrine',
};

const mockRequest = {
  session: mockSession,
  body: mockCheckoutData,
  params: {},
  query: {},
  db: {
    query: jest.fn(),
  },
};

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
  setHeader: jest.fn().mockReturnThis(),
};

const mockNext = jest.fn();

module.exports = {
  mockUsuario,
  mockAdmin,
  mockProduto,
  mockPedido,
  mockItemPedido,
  mockCarrinhoItem,
  mockConfiguracao,
  mockCheckoutData,
  mockSession,
  mockRequest,
  mockResponse,
  mockNext,
};
