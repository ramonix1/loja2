const express = require("express");
const router = express.Router();
const produtoController = require("../controllers/produtoController");
const upload = require("../middlewares/upload");
const { requireAdmin } = require("../middlewares/auth");

// Loja pública
router.get("/", produtoController.home);
router.get("/produto/:id", produtoController.detail);

// Admin - dashboard
router.get("/admin", requireAdmin, produtoController.dashboard);

// Admin - módulo Produtos
router.get("/admin/produtos", requireAdmin, produtoController.admin);
router.post("/salvar-produto", requireAdmin, upload.array("imagens", 10), produtoController.salvar);
router.get("/editar/:id", requireAdmin, produtoController.editar);
router.post("/atualizar/:id", requireAdmin, upload.array("imagens", 10), produtoController.atualizar);
router.get("/excluir/:id", requireAdmin, produtoController.excluir);
router.get("/excluir-imagem/:id", requireAdmin, produtoController.excluirImagem);
router.post("/admin/produtos/:id/estoque", requireAdmin, produtoController.atualizarEstoque);

module.exports = router;
