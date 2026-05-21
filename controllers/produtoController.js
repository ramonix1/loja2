const fs = require("fs").promises;
const path = require("path");

// ======================
// HOME (loja pública)
// ======================
exports.home = async (req, res) => {
  try {
    const produtos = await req.db.query(`
      SELECT p.*,
        (SELECT pi.url FROM produtos_imagens pi
         WHERE pi.produto_id = p.id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
      FROM produtos p
      ORDER BY p.created_at DESC
    `);

    let clientes = [];
    try {
      const clientesQuery = await req.db.query(
        "SELECT * FROM clientes WHERE ativo = true ORDER BY ordem ASC, nome ASC"
      );
      clientes = clientesQuery.rows;
    } catch (err) {
      // Tabela de clientes não existe, continua sem erro
      console.warn("Aviso: tabela de clientes não encontrada");
    }

    let banners = [];
    try {
      const bannersQuery = await req.db.query(
        `SELECT b.*, p.id AS prod_id FROM banners b
         LEFT JOIN produtos p ON p.id = b.produto_id
         WHERE b.ativo = true ORDER BY b.ordem ASC, b.created_at ASC`
      );
      banners = bannersQuery.rows;
    } catch (err) {
      console.warn("Aviso: tabela de banners não encontrada");
    }

    res.render("pages/index", { produtos: produtos.rows, clientes, banners });
  } catch (error) {
    console.error("Erro ao carregar home:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar produtos" });
  }
};


// ======================
// ADMIN DASHBOARD
// ======================
exports.dashboard = async (req, res) => {
  try {
    const result = await req.db.query("SELECT COUNT(*) FROM produtos");
    const totalProdutos = parseInt(result.rows[0].count);

    let totalBanners = 0;
    try {
      const bResult = await req.db.query("SELECT COUNT(*) FROM banners WHERE ativo = true");
      totalBanners = parseInt(bResult.rows[0].count);
    } catch {}

    res.render("pages/admin-dashboard", { totalProdutos, totalBanners });
  } catch (error) {
    console.error("Erro dashboard:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar painel" });
  }
};


// ======================
// ADMIN - LISTA PRODUTOS
// ======================
exports.admin = async (req, res) => {
  try {
    const produtos = await req.db.query(`
      SELECT p.*,
        (SELECT pi.url FROM produtos_imagens pi
         WHERE pi.produto_id = p.id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
      FROM produtos p
      ORDER BY p.created_at DESC
    `);
    res.render("pages/admin", { produtos: produtos.rows });
  } catch (error) {
    console.error("Erro admin:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar painel" });
  }
};


// ======================
// DETAIL
// ======================
exports.detail = async (req, res) => {
  const id = req.params.id;
  try {
    const produto = await req.db.query("SELECT * FROM produtos WHERE id = $1", [id]);
    if (produto.rows.length === 0) {
      return res.status(404).render("pages/error", { message: "Produto não encontrado" });
    }
    const imagens = await req.db.query(
      "SELECT * FROM produtos_imagens WHERE produto_id = $1 ORDER BY id ASC", [id]
    );
    res.render("pages/detail", { produto: produto.rows[0], imagens: imagens.rows });
  } catch (error) {
    console.error("Erro detail:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar produto" });
  }
};


// ======================
// SALVAR PRODUTO
// ======================
exports.salvar = async (req, res) => {
  const { titulo, subtitulo, valor, descricao } = req.body;
  try {
    const valorNumerico = parseFloat(
      (valor || "0").replace("R$", "").replace(/\./g, "").replace(",", ".").trim()
    );
    const produto = await req.db.query(
      `INSERT INTO produtos (nome, subtitulo, valor, descricao)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [titulo, subtitulo || null, valorNumerico, descricao || null]
    );
    const produtoId = produto.rows[0].id;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await req.db.query(
          `INSERT INTO produtos_imagens (produto_id, url) VALUES ($1, $2)`,
          [produtoId, `/images/${file.filename}`]
        );
      }
    }
    res.redirect("/admin/produtos");
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    res.status(500).render("pages/error", { message: "Erro ao salvar produto" });
  }
};


// ======================
// EDITAR
// ======================
exports.editar = async (req, res) => {
  const id = req.params.id;
  try {
    const produto = await req.db.query("SELECT * FROM produtos WHERE id = $1", [id]);
    if (produto.rows.length === 0) {
      return res.status(404).render("pages/error", { message: "Produto não encontrado" });
    }
    const imagens = await req.db.query(
      "SELECT * FROM produtos_imagens WHERE produto_id = $1 ORDER BY id ASC", [id]
    );
    res.render("pages/editar", { produto: produto.rows[0], imagens: imagens.rows });
  } catch (error) {
    console.error("Erro ao abrir edição:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar edição" });
  }
};


// ======================
// ATUALIZAR
// ======================
exports.atualizar = async (req, res) => {
  const id = req.params.id;
  const { titulo, subtitulo, valor, descricao } = req.body;
  try {
    const valorNumerico = parseFloat(
      (valor || "0").replace("R$", "").replace(/\./g, "").replace(",", ".").trim()
    );
    await req.db.query(
      `UPDATE produtos SET nome=$1, subtitulo=$2, valor=$3, descricao=$4 WHERE id=$5`,
      [titulo, subtitulo || null, valorNumerico, descricao || null, id]
    );
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await req.db.query(
          `INSERT INTO produtos_imagens (produto_id, url) VALUES ($1, $2)`,
          [id, `/images/${file.filename}`]
        );
      }
    }
    res.redirect("/admin/produtos");
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    res.status(500).render("pages/error", { message: "Erro ao atualizar produto" });
  }
};


// ======================
// EXCLUIR PRODUTO
// ======================
exports.excluir = async (req, res) => {
  const id = req.params.id;
  try {
    const imagens = await req.db.query(
      "SELECT url FROM produtos_imagens WHERE produto_id = $1", [id]
    );
    for (const img of imagens.rows) {
      const caminho = path.join(__dirname, "..", "public", img.url);
      try { await fs.unlink(caminho); } catch {}
    }
    await req.db.query("DELETE FROM produtos WHERE id=$1", [id]);
    res.redirect("/admin/produtos");
  } catch (error) {
    console.error("Erro ao excluir:", error);
    res.status(500).render("pages/error", { message: "Erro ao excluir produto" });
  }
};


// ======================
// EXCLUIR IMAGEM INDIVIDUAL
// ======================
exports.excluirImagem = async (req, res) => {
  const imgId = req.params.id;
  const produtoId = req.query.produto;
  try {
    const img = await req.db.query(
      "SELECT url FROM produtos_imagens WHERE id=$1", [imgId]
    );
    if (img.rows.length > 0) {
      const caminho = path.join(__dirname, "..", "public", img.rows[0].url);
      try { await fs.unlink(caminho); } catch {}
      await req.db.query("DELETE FROM produtos_imagens WHERE id=$1", [imgId]);
    }
    res.redirect(`/editar/${produtoId}`);
  } catch (error) {
    console.error("Erro ao excluir imagem:", error);
    res.status(500).render("pages/error", { message: "Erro ao excluir imagem" });
  }
};
