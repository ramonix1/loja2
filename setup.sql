-- ===========================================
-- SETUP DO BANCO DE DADOS - Lojão
-- Execute este arquivo no PostgreSQL:
--   psql -U postgres -d lojao -f setup.sql
-- ===========================================

-- Criar banco (se ainda não existir, execute manualmente):
-- CREATE DATABASE lojao;

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  subtitulo VARCHAR(255),
  valor NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de imagens dos produtos
CREATE TABLE IF NOT EXISTS produtos_imagens (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_produtos_imagens_produto_id ON produtos_imagens(produto_id);

-- Dados de exemplo (opcional)
-- INSERT INTO produtos (nome, subtitulo, valor, descricao) VALUES
--   ('Produto Exemplo', 'Subtítulo do produto', 99.90, 'Descrição detalhada do produto aqui.');
