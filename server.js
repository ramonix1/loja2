require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { csrfSync } = require('csrf-sync');

const db = require('./config/db');
const produtoRoutes = require('./routes/produtoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const authRoutes = require('./routes/authRoutes');
const carrinhoRoutes = require('./routes/carrinhoRoutes');
const initializeDatabase = require('./config/init-db');
const { requireAuth, requireAdmin } = require('./middlewares/auth');

const app = express();

// ── Segurança: headers HTTP ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://viacep.com.br'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.tailwindcss.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://placehold.co'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
    },
  },
}));

// ── Sessão com armazenamento PostgreSQL ───────────────────────────────────
app.use(session({
  store: new pgSession({
    pool: db,
    tableName: 'sessao',
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-troque-em-producao',
  resave: false,
  saveUninitialized: true,
  name: 'lojao.sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

// ── CSRF (Synchronizer Token Pattern — recomendado com sessões) ───────────
const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.body?._csrf || req.headers['x-csrf-token'],
});

// Expor token CSRF para todas as views
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  next();
});

// ── View engine ───────────────────────────────────────────────────────────
app.set('view engine', 'ejs');

// ── Inicializar banco de dados ────────────────────────────────────────────
initializeDatabase();

// ── Arquivos estáticos (sem autenticação) ─────────────────────────────────
app.use(express.static('public'));

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Variáveis globais para views ──────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuarioId
    ? { id: req.session.usuarioId, nome: req.session.nome, role: req.session.role }
    : null;
  next();
});

// ── CSRF: valida em POST/PUT/DELETE ───────────────────────────────────────
app.use(csrfSynchronisedProtection);

// ── Rotas de autenticação (públicas) ──────────────────────────────────────
app.use('/', authRoutes);

// ── Rotas protegidas ──────────────────────────────────────────────────────
app.use('/', requireAuth, produtoRoutes);
app.use('/', requireAdmin, clienteRoutes);
app.use('/', requireAdmin, bannerRoutes);
app.use('/', carrinhoRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('pages/error', { message: 'Página não encontrada' });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN' || err.status === 403) {
    return res.status(403).render('pages/error', { message: 'Token de segurança inválido. Recarregue a página.' });
  }
  console.error('Erro não tratado:', err);
  res.status(500).render('pages/error', { message: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
