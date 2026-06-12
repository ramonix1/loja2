/**
 * Redireciona rotas admin legacy para o app React (Fase 3+).
 * Env `ADMIN_URL` — ex.: http://localhost:5173 (dev).
 */
function adminRedirect(path) {
  const base = (process.env.ADMIN_URL || 'http://localhost:5173').replace(/\/$/, '');
  const target = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  return (_req, res) => res.redirect(302, target);
}

module.exports = { adminRedirect };
