const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");
const upload = require("../middlewares/upload");

// API - Listar clientes ativos
router.get("/api/clientes", clienteController.listar);

// Admin - Dashboard de clientes
router.get("/admin/clientes", clienteController.admin);

// Admin - Salvar novo cliente
router.post("/admin/clientes/salvar", upload.single("logo"), clienteController.salvar);

// Admin - Editar cliente
router.get("/admin/clientes/editar/:id", clienteController.editar);

// Admin - Atualizar cliente
router.post("/admin/clientes/atualizar/:id", upload.single("logo"), clienteController.atualizar);

// Admin - Excluir cliente
router.get("/admin/clientes/excluir/:id", clienteController.excluir);

module.exports = router;
