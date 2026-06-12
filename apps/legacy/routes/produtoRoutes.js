const express = require("express");
const router = express.Router();
const produtoController = require("../controllers/produtoController");
const { requireAdmin } = require("../middlewares/auth");
const { adminRedirect } = require("../utils/adminRedirect");

const adminBase = (process.env.ADMIN_URL || "http://localhost:5173").replace(/\/$/, "");

// Loja pública — permanecem no legacy
router.get("/", produtoController.home);
router.get("/produto/:id", produtoController.detail);

// Fase 3: dashboard migrado para React
router.get("/admin", requireAdmin, adminRedirect("/admin/dashboard"));

// Fase 3: módulo Produtos migrado para React — redirect 302
router.get("/admin/produtos", requireAdmin, adminRedirect("/admin/produtos"));
router.post("/salvar-produto", requireAdmin, adminRedirect("/admin/produtos"));
router.get("/editar/:id", requireAdmin, (req, res) => {
  res.redirect(302, `${adminBase}/admin/produtos/${req.params.id}`);
});
router.post("/atualizar/:id", requireAdmin, (req, res) => {
  res.redirect(302, `${adminBase}/admin/produtos/${req.params.id}`);
});
router.get("/excluir/:id", requireAdmin, adminRedirect("/admin/produtos"));
router.get("/excluir-imagem/:id", requireAdmin, (req, res) => {
  const produtoId = req.query.produto;
  if (produtoId) {
    return res.redirect(302, `${adminBase}/admin/produtos/${produtoId}`);
  }
  res.redirect(302, `${adminBase}/admin/produtos`);
});
router.post("/admin/produtos/:id/estoque", requireAdmin, adminRedirect("/admin/produtos"));

module.exports = router;
