const express = require('express');
const router = express.Router();
const aparencia = require('../controllers/aparenciaController');
const { requireAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/admin/aparencia', requireAdmin, aparencia.exibir);
router.post('/admin/aparencia',
  requireAdmin,
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]),
  aparencia.salvar
);

module.exports = router;
