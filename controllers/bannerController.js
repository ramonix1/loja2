const db = require("../config/db");
const fs = require("fs").promises;
const path = require("path");

// ======================
// ADMIN - LISTA BANNERS
// ======================
exports.admin = async (req, res) => {
  try {
    const banners = await db.query(`
      SELECT b.*, p.nome AS produto_nome
      FROM banners b
      LEFT JOIN produtos p ON p.id = b.produto_id
      ORDER BY b.ordem ASC, b.created_at DESC
    `);
    res.render("pages/admin-banners", { banners: banners.rows });
  } catch (error) {
    console.error("Erro ao listar banners:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar banners" });
  }
};

// ======================
// ADMIN - FORM NOVO
// ======================
exports.novo = async (req, res) => {
  try {
    const produtos = await db.query("SELECT id, nome FROM produtos ORDER BY nome ASC");
    res.render("pages/admin-banner-form", {
      banner: null,
      produtos: produtos.rows,
    });
  } catch (error) {
    console.error("Erro ao abrir form banner:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar formulário" });
  }
};

// ======================
// SALVAR BANNER
// ======================
exports.salvar = async (req, res) => {
  const { titulo, subtitulo, cta_texto, cta_url, produto_id, ativo, ordem } = req.body;
  try {
    if (!req.file) {
      return res.status(400).render("pages/error", { message: "Imagem obrigatória para o banner" });
    }
    const imagemUrl = `/images/${req.file.filename}`;
    const produtoIdVal = produto_id && produto_id !== "" ? parseInt(produto_id) : null;
    const ctaUrl = cta_url && cta_url.trim() !== "" ? cta_url.trim() : null;

    await db.query(
      `INSERT INTO banners (titulo, subtitulo, imagem, cta_texto, cta_url, produto_id, ativo, ordem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        titulo,
        subtitulo || null,
        imagemUrl,
        cta_texto || "Ver oferta",
        ctaUrl,
        produtoIdVal,
        ativo === "on" || ativo === "true",
        parseInt(ordem) || 0,
      ]
    );
    res.redirect("/admin/banners");
  } catch (error) {
    console.error("Erro ao salvar banner:", error);
    res.status(500).render("pages/error", { message: "Erro ao salvar banner" });
  }
};

// ======================
// ADMIN - FORM EDITAR
// ======================
exports.editar = async (req, res) => {
  const { id } = req.params;
  try {
    const banner = await db.query("SELECT * FROM banners WHERE id = $1", [id]);
    if (banner.rows.length === 0) {
      return res.status(404).render("pages/error", { message: "Banner não encontrado" });
    }
    const produtos = await db.query("SELECT id, nome FROM produtos ORDER BY nome ASC");
    res.render("pages/admin-banner-form", {
      banner: banner.rows[0],
      produtos: produtos.rows,
    });
  } catch (error) {
    console.error("Erro ao abrir edição banner:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar edição" });
  }
};

// ======================
// ATUALIZAR BANNER
// ======================
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { titulo, subtitulo, cta_texto, cta_url, produto_id, ativo, ordem } = req.body;
  try {
    const produtoIdVal = produto_id && produto_id !== "" ? parseInt(produto_id) : null;
    const ctaUrl = cta_url && cta_url.trim() !== "" ? cta_url.trim() : null;
    const ativoVal = ativo === "on" || ativo === "true";

    if (req.file) {
      const antigoBanner = await db.query("SELECT imagem FROM banners WHERE id=$1", [id]);
      if (antigoBanner.rows.length > 0) {
        const caminho = path.join(__dirname, "..", "public", antigoBanner.rows[0].imagem);
        try { await fs.unlink(caminho); } catch {}
      }
      await db.query(
        `UPDATE banners SET titulo=$1, subtitulo=$2, imagem=$3, cta_texto=$4, cta_url=$5,
         produto_id=$6, ativo=$7, ordem=$8, updated_at=NOW() WHERE id=$9`,
        [titulo, subtitulo || null, `/images/${req.file.filename}`, cta_texto || "Ver oferta",
         ctaUrl, produtoIdVal, ativoVal, parseInt(ordem) || 0, id]
      );
    } else {
      await db.query(
        `UPDATE banners SET titulo=$1, subtitulo=$2, cta_texto=$3, cta_url=$4,
         produto_id=$5, ativo=$6, ordem=$7, updated_at=NOW() WHERE id=$8`,
        [titulo, subtitulo || null, cta_texto || "Ver oferta",
         ctaUrl, produtoIdVal, ativoVal, parseInt(ordem) || 0, id]
      );
    }
    res.redirect("/admin/banners");
  } catch (error) {
    console.error("Erro ao atualizar banner:", error);
    res.status(500).render("pages/error", { message: "Erro ao atualizar banner" });
  }
};

// ======================
// EXCLUIR BANNER
// ======================
exports.excluir = async (req, res) => {
  const { id } = req.params;
  try {
    const banner = await db.query("SELECT imagem FROM banners WHERE id=$1", [id]);
    if (banner.rows.length > 0) {
      const caminho = path.join(__dirname, "..", "public", banner.rows[0].imagem);
      try { await fs.unlink(caminho); } catch {}
      await db.query("DELETE FROM banners WHERE id=$1", [id]);
    }
    res.redirect("/admin/banners");
  } catch (error) {
    console.error("Erro ao excluir banner:", error);
    res.status(500).render("pages/error", { message: "Erro ao excluir banner" });
  }
};

// ======================
// TOGGLE ATIVO
// ======================
exports.toggleAtivo = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE banners SET ativo = NOT ativo, updated_at=NOW() WHERE id=$1", [id]);
    res.redirect("/admin/banners");
  } catch (error) {
    console.error("Erro ao alternar status:", error);
    res.status(500).render("pages/error", { message: "Erro ao alterar status" });
  }
};
