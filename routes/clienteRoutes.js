const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");
const upload = require("../middlewares/upload");
const { requireAdmin, requireAuth } = require("../middlewares/auth");

// API - Listar clientes ativos (acessível por qualquer usuário autenticado)
router.get("/api/clientes", requireAuth, clienteController.listar);

// Admin - Dashboard de clientes
router.get("/admin/clientes", requireAdmin, clienteController.admin);

// Admin - Salvar novo cliente
router.post("/admin/clientes/salvar", requireAdmin, upload.single("logo"), clienteController.salvar);

// Admin - Editar cliente
router.get("/admin/clientes/editar/:id", requireAdmin, clienteController.editar);

// Admin - Atualizar cliente
router.post("/admin/clientes/atualizar/:id", requireAdmin, upload.single("logo"), clienteController.atualizar);

// Admin - Excluir cliente
router.get("/admin/clientes/excluir/:id", requireAdmin, clienteController.excluir);

module.exports = router;
