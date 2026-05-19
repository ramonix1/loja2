function requireAuth(req, res, next) {
  if (req.session && req.session.usuarioId) return next();
  req.session.redirecionarPara = req.originalUrl;
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.usuarioId && req.session.role === 'admin') return next();
  if (!req.session || !req.session.usuarioId) {
    req.session.redirecionarPara = req.originalUrl;
    return res.redirect('/login');
  }
  res.status(403).render('pages/error', { message: 'Acesso restrito a administradores.' });
}

function requireGuest(req, res, next) {
  if (req.session && req.session.usuarioId) return res.redirect('/');
  next();
}

module.exports = { requireAuth, requireAdmin, requireGuest };
