-- ===========================================
-- BANCO COMPLETO - Lojão
-- Para bancos já existentes, execute:
--   psql -U postgres -d lojao -f banco.sql
-- ===========================================

-- Adicionar coluna updated_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE produtos ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- Tabela de produtos (se não existir)
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  subtitulo VARCHAR(255),
  valor NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de imagens
CREATE TABLE IF NOT EXISTS produtos_imagens (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_imagens_produto_id ON produtos_imagens(produto_id);

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  tabela VARCHAR(100) NOT NULL,
  registro_id INTEGER,
  acao VARCHAR(10) NOT NULL,
  dados_antigos JSONB,
  dados_novos JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabela ON auditoria(tabela);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria(created_at DESC);

-- ===========================================
-- TRIGGER DE AUDITORIA AUTOMÁTICA
-- ===========================================

CREATE OR REPLACE FUNCTION fn_auditoria_produtos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria (tabela, registro_id, acao, dados_novos)
    VALUES ('produtos', NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria (tabela, registro_id, acao, dados_antigos, dados_novos)
    VALUES ('produtos', NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria (tabela, registro_id, acao, dados_antigos)
    VALUES ('produtos', OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_produtos ON produtos;
CREATE TRIGGER trg_auditoria_produtos
  AFTER INSERT OR UPDATE OR DELETE ON produtos
  FOR EACH ROW EXECUTE FUNCTION fn_auditoria_produtos();

-- Função de auditoria automática
CREATE OR REPLACE FUNCTION fn_auditoria_produtos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria (tabela, registro_id, acao, dados_novos)
    VALUES ('produtos', NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria (tabela, registro_id, acao, dados_antigos, dados_novos)
    VALUES ('produtos', NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria (tabela, registro_id, acao, dados_antigos)
    VALUES ('produtos', OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_produtos ON produtos;
CREATE TRIGGER trg_auditoria_produtos
  AFTER INSERT OR UPDATE OR DELETE ON produtos
  FOR EACH ROW EXECUTE FUNCTION fn_auditoria_produtos();
