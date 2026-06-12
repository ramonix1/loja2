const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const upload = require("../middlewares/upload");
const { requireAdmin } = require("../middlewares/auth");

router.get("/admin/banners", requireAdmin, bannerController.admin);
router.get("/admin/banners/novo", requireAdmin, bannerController.novo);
router.post("/admin/banners/salvar", requireAdmin, upload.single("imagem"), bannerController.salvar);
router.get("/admin/banners/editar/:id", requireAdmin, bannerController.editar);
router.post("/admin/banners/atualizar/:id", requireAdmin, upload.single("imagem"), bannerController.atualizar);
router.get("/admin/banners/excluir/:id", requireAdmin, bannerController.excluir);
router.post("/admin/banners/toggle/:id", requireAdmin, bannerController.toggleAtivo);

module.exports = router;
