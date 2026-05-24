const argon2 = require('argon2');

async function initializeTenant(pool, adminEmail, adminSenha, adminNome = 'Administrador') {
  // Usuários e autenticação
  await pool.query(`
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

    CREATE TABLE IF NOT EXISTS tentativas_login (
      id SERIAL PRIMARY KEY,
      ip VARCHAR(45) NOT NULL UNIQUE,
      email VARCHAR(255),
      tentativas INTEGER DEFAULT 0,
      bloqueado_ate TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_tentativas_ip ON tentativas_login(ip);

    CREATE TABLE IF NOT EXISTS tokens_recuperacao (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      canal VARCHAR(10) DEFAULT 'email' CHECK (canal IN ('email', 'sms')),
      usado BOOLEAN DEFAULT false,
      expira_em TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_tokens_hash    ON tokens_recuperacao(token_hash);
    CREATE INDEX IF NOT EXISTS idx_tokens_usuario ON tokens_recuperacao(usuario_id);
  `);

  // Categorias
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      ordem INTEGER DEFAULT 0,
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_categorias_ordem ON categorias(ordem ASC);
  `);

  // Produtos
  await pool.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      subtitulo VARCHAR(255),
      valor NUMERIC(10,2) NOT NULL DEFAULT 0,
      descricao TEXT,
      estoque INTEGER DEFAULT NULL,
      categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estoque INTEGER DEFAULT NULL;

    CREATE TABLE IF NOT EXISTS produtos_imagens (
      id SERIAL PRIMARY KEY,
      produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
      url VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_produtos_imagens_produto_id ON produtos_imagens(produto_id);

    CREATE TABLE IF NOT EXISTS auditoria (
      id SERIAL PRIMARY KEY,
      tabela VARCHAR(100) NOT NULL,
      registro_id INTEGER,
      acao VARCHAR(10) NOT NULL,
      dados_antigos JSONB,
      dados_novos JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_auditoria_tabela      ON auditoria(tabela);
    CREATE INDEX IF NOT EXISTS idx_auditoria_created_at  ON auditoria(created_at DESC);
  `);

  // Clientes (logos parceiros exibidos na homepage)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      logo VARCHAR(500),
      website VARCHAR(255),
      ordem INTEGER DEFAULT 0,
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_clientes_ordem ON clientes(ordem ASC);
    CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
  `);

  // Banners
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      subtitulo VARCHAR(500),
      imagem VARCHAR(500) NOT NULL,
      cta_texto VARCHAR(100) DEFAULT 'Ver oferta',
      cta_url VARCHAR(500),
      produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
      ativo BOOLEAN DEFAULT true,
      ordem INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_banners_ativo  ON banners(ativo);
    CREATE INDEX IF NOT EXISTS idx_banners_ordem  ON banners(ordem ASC);
  `);

  // Carrinho
  await pool.query(`
    CREATE TABLE IF NOT EXISTS carrinho_itens (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
      quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
      preco_unitario NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (usuario_id, produto_id)
    );
    CREATE INDEX IF NOT EXISTS idx_carrinho_usuario ON carrinho_itens(usuario_id);
  `);

  // Pedidos e pagamentos
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      nome_entrega VARCHAR(255) NOT NULL,
      email_entrega VARCHAR(255) NOT NULL,
      telefone_entrega VARCHAR(20),
      cpf_entrega VARCHAR(14),
      cep VARCHAR(9),
      logradouro VARCHAR(255),
      numero VARCHAR(20),
      complemento VARCHAR(100),
      bairro VARCHAR(100),
      cidade VARCHAR(100),
      estado VARCHAR(2),
      subtotal NUMERIC(10,2) NOT NULL,
      frete NUMERIC(10,2) NOT NULL DEFAULT 0,
      total NUMERIC(10,2) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'aguardando_pagamento'
        CHECK (status IN ('aguardando_pagamento','pago','em_separacao','enviado','entregue','cancelado')),
      metodo_pagamento VARCHAR(20),
      mp_payment_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_pedidos_status  ON pedidos(status);
    CREATE INDEX IF NOT EXISTS idx_pedidos_mp      ON pedidos(mp_payment_id);

    CREATE TABLE IF NOT EXISTS pedido_itens (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
      nome_produto VARCHAR(255) NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unitario NUMERIC(10,2) NOT NULL,
      subtotal NUMERIC(10,2) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens(pedido_id);

    CREATE TABLE IF NOT EXISTS pagamentos (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      mp_payment_id VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'pendente',
      status_mp VARCHAR(30),
      valor NUMERIC(10,2) NOT NULL,
      metodo VARCHAR(20),
      resposta_json TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON pagamentos(pedido_id);
    CREATE INDEX IF NOT EXISTS idx_pagamentos_mp     ON pagamentos(mp_payment_id);
  `);

  // Módulo Agenda (buffet / eventos)
  await pool.query(`
    ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_evento DATE;

    CREATE TABLE IF NOT EXISTS agenda_config (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      capacidade_diaria INTEGER NOT NULL DEFAULT 1,
      antecedencia_minima_dias INTEGER NOT NULL DEFAULT 1,
      antecedencia_maxima_dias INTEGER NOT NULL DEFAULT 180,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    INSERT INTO agenda_config (id, capacidade_diaria, antecedencia_minima_dias, antecedencia_maxima_dias)
    VALUES (1, 1, 1, 180) ON CONFLICT (id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS agenda_dias_especiais (
      data DATE PRIMARY KEY,
      capacidade INTEGER,
      motivo VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      data_evento DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'confirmado'
        CHECK (status IN ('confirmado', 'cancelado')),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_agendamentos_data   ON agendamentos(data_evento);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_pedido ON agendamentos(pedido_id);
  `);

  // Movimentações de estoque
  await pool.query(`
    CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
      id SERIAL PRIMARY KEY,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
      quantidade INTEGER NOT NULL,
      origem VARCHAR(30),
      origem_id INTEGER,
      observacao TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_movest_produto ON movimentacoes_estoque(produto_id);
  `);

  // Configurações da loja (chave-valor)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave VARCHAR(100) PRIMARY KEY,
      valor TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );
    INSERT INTO configuracoes (chave, valor) VALUES
      ('controla_estoque', 'false'),
      ('reservar_estoque_carrinho', 'false'),
      ('modulo_agenda', 'false'),
      ('habilitar_sumup', 'false'),
      ('loja_nome', 'Lojão'),
      ('loja_slogan', ''),
      ('loja_logo', ''),
      ('loja_favicon', ''),
      ('loja_cor_primaria', '#2563eb'),
      ('loja_rodape', ''),
      ('loja_email', ''),
      ('loja_whatsapp', '')
    ON CONFLICT (chave) DO NOTHING;
  `);

  // Admin inicial
  const adminExiste = await pool.query("SELECT id FROM usuarios WHERE role = 'admin' LIMIT 1");
  if (adminExiste.rows.length === 0) {
    const senhaHash = await argon2.hash(adminSenha, {
      type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4,
    });
    await pool.query(
      "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES ($1, $2, $3, 'admin')",
      [adminNome, adminEmail, senhaHash]
    );
  }
}

module.exports = { initializeTenant };
