-- Tenant: usuários e admins da loja
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'usuario' CHECK (role IN ('usuario', 'admin')),
  telefone VARCHAR(20),
  cpf VARCHAR(14),
  cep VARCHAR(9),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  ativo BOOLEAN DEFAULT true,
  tentativas_falha INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP,
  ultimo_acesso TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role  ON usuarios(role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf) WHERE cpf IS NOT NULL;
