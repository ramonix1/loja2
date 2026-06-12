const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const { adminRedirect } = require('../utils/adminRedirect');

router.get('/admin/chat', requireAdmin, adminRedirect('/admin/chat'));

module.exports = router;
