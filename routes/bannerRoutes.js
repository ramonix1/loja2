const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const upload = require("../middlewares/upload");

router.get("/admin/banners", bannerController.admin);
router.get("/admin/banners/novo", bannerController.novo);
router.post("/admin/banners/salvar", upload.single("imagem"), bannerController.salvar);
router.get("/admin/banners/editar/:id", bannerController.editar);
router.post("/admin/banners/atualizar/:id", upload.single("imagem"), bannerController.atualizar);
router.get("/admin/banners/excluir/:id", bannerController.excluir);
router.post("/admin/banners/toggle/:id", bannerController.toggleAtivo);

module.exports = router;
