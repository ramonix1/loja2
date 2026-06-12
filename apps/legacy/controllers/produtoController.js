const fs = require("fs").promises;
const path = require("path");
const { getConfigs } = require('./configController');

// ======================
// HOME (loja pública)
// ======================
exports.home = async (req, res) => {
  try {
    const [categoriasRes, produtosSemCatRes, configs] = await Promise.all([
      req.db.query(`
        SELECT c.id AS cat_id, c.nome AS cat_nome, c.ordem AS cat_ordem,
               p.id, p.nome, p.subtitulo, p.valor, p.estoque, p.created_at,
               (SELECT pi.url FROM produtos_imagens pi WHERE pi.produto_id = p.id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
        FROM categorias c
        JOIN produtos p ON p.categoria_id = c.id
        WHERE c.ativo = true
        ORDER BY c.ordem ASC, c.nome ASC, p.created_at DESC
      `).catch(() => ({ rows: [] })),
      req.db.query(`
        SELECT p.*,
               (SELECT pi.url FROM produtos_imagens pi WHERE pi.produto_id = p.id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
        FROM produtos p
        WHERE p.categoria_id IS NULL
        ORDER BY p.created_at DESC
      `),
      getConfigs(req.db),
    ]);

    // Agrupar produtos por categoria
    const categoriaMap = new Map();
    for (const row of categoriasRes.rows) {
      if (!categoriaMap.has(row.cat_id)) {
        categoriaMap.set(row.cat_id, { id: row.cat_id, nome: row.cat_nome, ordem: row.cat_ordem, produtos: [] });
      }
      categoriaMap.get(row.cat_id).produtos.push(row);
    }
    const categorias = [...categoriaMap.values()];
    const produtosSemCategoria = produtosSemCatRes.rows;
    const produtos = [...categoriasRes.rows, ...produtosSemCategoria];

    let clientes = [];
    try {
      clientes = (await req.db.query(
        "SELECT * FROM clientes WHERE ativo = true ORDER BY ordem ASC, nome ASC"
      )).rows;
    } catch {}

    let banners = [];
    try {
      banners = (await req.db.query(
        `SELECT b.*, p.id AS prod_id FROM banners b
         LEFT JOIN produtos p ON p.id = b.produto_id
         WHERE b.ativo = true ORDER BY b.ordem ASC, b.created_at ASC`
      )).rows;
    } catch {}

    res.render("pages/index", { produtos, categorias, produtosSemCategoria, clientes, banners, configs });
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
    const [
      prodRes, bannerRes, catRes, pedidosRes, receitaRes, pedidosRecentesRes
    ] = await Promise.allSettled([
      req.db.query("SELECT COUNT(*) FROM produtos"),
      req.db.query("SELECT COUNT(*) FROM banners WHERE ativo = true"),
      req.db.query("SELECT COUNT(*) FROM categorias"),
      req.db.query("SELECT COUNT(*) FROM pedidos"),
      req.db.query("SELECT COALESCE(SUM(total),0) AS total FROM pedidos WHERE status = 'pago'"),
      req.db.query(`
        SELECT p.id, p.status, p.total, p.created_at, p.metodo_pagamento,
               u.nome AS cliente_nome
        FROM pedidos p
        JOIN usuarios u ON u.id = p.usuario_id
        ORDER BY p.created_at DESC LIMIT 5
      `),
    ]);

    res.render("pages/admin-dashboard", {
      totalProdutos:   prodRes.status === 'fulfilled'   ? parseInt(prodRes.value.rows[0].count)    : 0,
      totalBanners:    bannerRes.status === 'fulfilled'  ? parseInt(bannerRes.value.rows[0].count)  : 0,
      totalCategorias: catRes.status === 'fulfilled'     ? parseInt(catRes.value.rows[0].count)     : 0,
      totalPedidos:    pedidosRes.status === 'fulfilled' ? parseInt(pedidosRes.value.rows[0].count) : 0,
      receitaTotal:    receitaRes.status === 'fulfilled' ? parseFloat(receitaRes.value.rows[0].total) : 0,
      pedidosRecentes: pedidosRecentesRes.status === 'fulfilled' ? pedidosRecentesRes.value.rows : [],
      activePage: 'dashboard',
    });
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
    const [produtosRes, configs] = await Promise.all([
      req.db.query(`
        SELECT p.*,
          (SELECT pi.url FROM produtos_imagens pi
           WHERE pi.produto_id = p.id ORDER BY pi.id ASC LIMIT 1) AS primeira_imagem
        FROM produtos p
        ORDER BY p.created_at DESC
      `),
      getConfigs(req.db),
    ]);
    res.render("pages/admin", { produtos: produtosRes.rows, configs, activePage: 'produtos' });
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
    const [produtoRes, imagensRes, configs] = await Promise.all([
      req.db.query("SELECT * FROM produtos WHERE id = $1", [id]),
      req.db.query("SELECT * FROM produtos_imagens WHERE produto_id = $1 ORDER BY id ASC", [id]),
      getConfigs(req.db),
    ]);
    if (produtoRes.rows.length === 0) {
      return res.status(404).render("pages/error", { message: "Produto não encontrado" });
    }
    res.render("pages/detail", { produto: produtoRes.rows[0], imagens: imagensRes.rows, configs });
  } catch (error) {
    console.error("Erro detail:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar produto" });
  }
};


// ======================
// SALVAR PRODUTO
// ======================
exports.salvar = async (req, res) => {
  const { titulo, subtitulo, valor, descricao, estoque } = req.body;
  try {
    const valorNumerico = parseFloat(
      (valor || "0").replace("R$", "").replace(/\./g, "").replace(",", ".").trim()
    );
    const estoqueVal = estoque !== undefined && estoque !== '' ? parseInt(estoque) : null;
    const produto = await req.db.query(
      `INSERT INTO produtos (nome, subtitulo, valor, descricao, estoque)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [titulo, subtitulo || null, valorNumerico, descricao || null, estoqueVal]
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
    const [produtoRes, imagensRes, configs] = await Promise.all([
      req.db.query("SELECT * FROM produtos WHERE id = $1", [id]),
      req.db.query("SELECT * FROM produtos_imagens WHERE produto_id = $1 ORDER BY id ASC", [id]),
      getConfigs(req.db),
    ]);
    if (produtoRes.rows.length === 0) {
      return res.status(404).render("pages/error", { message: "Produto não encontrado" });
    }
    res.render("pages/editar", { produto: produtoRes.rows[0], imagens: imagensRes.rows, configs, activePage: 'produtos' });
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
  const { titulo, subtitulo, valor, descricao, estoque } = req.body;
  try {
    const valorNumerico = parseFloat(
      (valor || "0").replace("R$", "").replace(/\./g, "").replace(",", ".").trim()
    );
    const estoqueVal = estoque !== undefined && estoque !== '' ? parseInt(estoque) : null;
    await req.db.query(
      `UPDATE produtos SET nome=$1, subtitulo=$2, valor=$3, descricao=$4, estoque=$5, updated_at=NOW() WHERE id=$6`,
      [titulo, subtitulo || null, valorNumerico, descricao || null, estoqueVal, id]
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
// AJUSTE RÁPIDO DE ESTOQUE
// ======================
exports.atualizarEstoque = async (req, res) => {
  const { id } = req.params;
  const { estoque, observacao } = req.body;
  try {
    const estoqueAnteriorRes = await req.db.query('SELECT estoque FROM produtos WHERE id = $1', [id]);
    const estoqueAnterior = estoqueAnteriorRes.rows[0]?.estoque ?? null;
    const estoqueNovo = estoque === '' || estoque === null || estoque === undefined
      ? null
      : Math.max(0, parseInt(estoque));

    await req.db.query(
      'UPDATE produtos SET estoque = $1, updated_at = NOW() WHERE id = $2',
      [estoqueNovo, id]
    );

    if (estoqueNovo !== null) {
      const diff = estoqueAnterior !== null ? estoqueNovo - estoqueAnterior : estoqueNovo;
      const tipo = diff >= 0 ? 'ajuste' : 'saida';
      try {
        await req.db.query(
          'INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, origem, observacao) VALUES ($1,$2,$3,$4,$5)',
          [id, tipo, Math.abs(diff), 'admin_ajuste', observacao || 'Ajuste manual']
        );
      } catch (logErr) {
        console.error(' Falha ao registrar movimentação de estoque:', logErr.message);
      }
    }

    res.redirect('/admin/produtos');
  } catch (err) {
    console.error('Erro ao atualizar estoque:', err);
    res.redirect('/admin/produtos');
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
