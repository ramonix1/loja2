const fs = require("fs").promises;
const path = require("path");

function idValido(id) {
  return /^\d+$/.test(id);
}

// ======================
// LISTAR CLIENTES (API)
// ======================
exports.listar = async (req, res) => {
  try {
    const clientes = await req.db.query(
      "SELECT * FROM clientes WHERE ativo = true ORDER BY ordem ASC, nome ASC"
    );
    res.json(clientes.rows);
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    res.status(500).json({ erro: "Erro ao listar clientes" });
  }
};

// ======================
// LISTAR CLIENTES (ADMIN)
// ======================
exports.admin = async (req, res) => {
  try {
    const clientes = await req.db.query(
      "SELECT * FROM clientes ORDER BY ordem ASC, nome ASC"
    );
    res.render("pages/admin-clientes", { clientes: clientes.rows });
  } catch (error) {
    console.error("Erro ao carregar admin de clientes:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar clientes" });
  }
};

// ======================
// SALVAR CLIENTE
// ======================
exports.salvar = async (req, res) => {
  const { nome, website, ordem } = req.body;
  const logo = req.file ? `/images/${req.file.filename}` : null;

  if (!nome || nome.trim() === "") {
    return res.status(400).render("pages/error", { message: "Nome do cliente é obrigatório" });
  }

  try {
    await req.db.query(
      `INSERT INTO clientes (nome, logo, website, ordem)
       VALUES ($1, $2, $3, $4)`,
      [nome, logo, website || null, ordem || 0]
    );
    res.redirect("/admin/clientes");
  } catch (error) {
    console.error("Erro ao salvar cliente:", error);
    res.status(500).render("pages/error", { message: "Erro ao salvar cliente" });
  }
};

// ======================
// EDITAR CLIENTE (GET)
// ======================
exports.editar = async (req, res) => {
  const id = req.params.id;
  if (!idValido(id)) {
    return res.status(400).render("pages/error", { message: "ID inválido" });
  }

  try {
    const cliente = await req.db.query("SELECT * FROM clientes WHERE id = $1", [id]);
    if (cliente.rows.length === 0) {
      return res.status(404).render("pages/error", { message: "Cliente não encontrado" });
    }
    res.render("pages/editar-cliente", { cliente: cliente.rows[0] });
  } catch (error) {
    console.error("Erro ao editar cliente:", error);
    res.status(500).render("pages/error", { message: "Erro ao carregar cliente" });
  }
};

// ======================
// ATUALIZAR CLIENTE
// ======================
exports.atualizar = async (req, res) => {
  const id = req.params.id;
  const { nome, website, ordem, ativo } = req.body;

  if (!idValido(id)) {
    return res.status(400).render("pages/error", { message: "ID inválido" });
  }

  if (!nome || nome.trim() === "") {
    return res.status(400).render("pages/error", { message: "Nome do cliente é obrigatório" });
  }

  try {
    const cliente = await req.db.query("SELECT * FROM clientes WHERE id = $1", [id]);
    if (cliente.rows.length === 0) {
      return res.status(404).render("pages/error", { message: "Cliente não encontrado" });
    }

    let logo = cliente.rows[0].logo;

    // Se foi enviado uma nova logo, atualizar
    if (req.file) {
      // Deletar logo antiga se existir
      if (logo) {
        const caminho = path.join(__dirname, "..", "public", logo);
        try {
          await fs.unlink(caminho);
        } catch {}
      }
      logo = `/images/${req.file.filename}`;
    }

    await req.db.query(
      `UPDATE clientes SET nome = $1, logo = $2, website = $3, ordem = $4, ativo = $5, updated_at = NOW()
       WHERE id = $6`,
      [nome, logo, website || null, ordem || 0, ativo === "true" || ativo === true, id]
    );

    res.redirect("/admin/clientes");
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).render("pages/error", { message: "Erro ao atualizar cliente" });
  }
};

// ======================
// EXCLUIR CLIENTE
// ======================
exports.excluir = async (req, res) => {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).render("pages/error", { message: "ID inválido" });
  }

  try {
    const cliente = await req.db.query("SELECT * FROM clientes WHERE id = $1", [id]);
    if (cliente.rows.length === 0) {
      return res.status(404).render("pages/error", { message: "Cliente não encontrado" });
    }

    // Deletar logo se existir
    if (cliente.rows[0].logo) {
      const caminho = path.join(__dirname, "..", "public", cliente.rows[0].logo);
      try {
        await fs.unlink(caminho);
      } catch {}
    }

    await req.db.query("DELETE FROM clientes WHERE id = $1", [id]);
    res.redirect("/admin/clientes");
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    res.status(500).render("pages/error", { message: "Erro ao excluir cliente" });
  }
};
