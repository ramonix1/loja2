const db = require("./db");

async function initializeDatabase() {
  try {
    // Criar tabelas base
    await db.query(`
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

    // Criar tabela de banners
    await db.query(`
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

      CREATE INDEX IF NOT EXISTS idx_banners_ativo ON banners(ativo);
      CREATE INDEX IF NOT EXISTS idx_banners_ordem ON banners(ordem ASC);
    `);

    console.log("✅ Tabelas verificadas/criadas");

    // Verificar se já existem clientes
    const result = await db.query("SELECT COUNT(*) as count FROM clientes");
    const totalClientes = parseInt(result.rows[0].count);

    if (totalClientes === 0) {
      // Inserir clientes padrão
      const clientesPadrao = [
        { nome: "ITG", logo: "/images/itg.png", ordem: 1 },
        { nome: "Mobit", logo: "/images/mobit.png", ordem: 2 },
        { nome: "Geosales", logo: "/images/geosales.png", ordem: 3 },
        { nome: "Schindler", logo: "/images/schindler.png", ordem: 4 },
        { nome: "Teclat", logo: "/images/teclat.png", ordem: 5 },
      ];

      for (const cliente of clientesPadrao) {
        await db.query(
          "INSERT INTO clientes (nome, logo, ordem, ativo) VALUES ($1, $2, $3, true)",
          [cliente.nome, cliente.logo, cliente.ordem]
        );
      }

      console.log("✅ Clientes padrão inseridos com sucesso");
    } else {
      console.log(`✅ ${totalClientes} cliente(s) já cadastrado(s)`);
    }
  } catch (error) {
    console.warn("⚠️  Erro ao inicializar banco de dados:", error.message);
    console.warn("Os clientes não estarão disponíveis na homepage");
  }
}

module.exports = initializeDatabase;
