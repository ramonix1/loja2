const express = require("express");
const router = express.Router();
const produtoController = require("../controllers/produtoController");
const upload = require("../middlewares/upload");

// Loja pública
router.get("/", produtoController.home);
router.get("/produto/:id", produtoController.detail);

// Admin - dashboard (tela inicial)
router.get("/admin", produtoController.dashboard);

// Admin - módulo Produtos (novo prefixo /admin/produtos)
router.get("/admin/produtos", produtoController.admin);
router.post("/salvar-produto", upload.array("imagens", 10), produtoController.salvar);
router.get("/editar/:id", produtoController.editar);
router.post("/atualizar/:id", upload.array("imagens", 10), produtoController.atualizar);
router.get("/excluir/:id", produtoController.excluir);
router.get("/excluir-imagem/:id", produtoController.excluirImagem);

module.exports = router;
