require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { csrfSync } = require('csrf-sync');

const masterDb = require('./config/masterDb');
const produtoRoutes = require('./routes/produtoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const authRoutes = require('./routes/authRoutes');
const carrinhoRoutes = require('./routes/carrinhoRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const configRoutes = require('./routes/configRoutes');
const initializeDatabase = require('./config/init-db');


const tenantMiddleware = require('./middlewares/tenant');

const app = express();

// Necessário para funcionar corretamente atrás de proxies (ngrok, nginx, etc.)
app.set('trust proxy', 1);

// ── Segurança: headers HTTP ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://viacep.com.br', 'https://api.mercadopago.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.tailwindcss.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://placehold.co'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://sdk.mercadopago.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
    },
  },
}));

// ── Sessão — armazenada no banco MASTER (compartilhado entre tenants) ─────
app.use(session({
  store: new pgSession({
    pool: masterDb,
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

// ── CSRF (Synchronizer Token Pattern) ─────────────────────────────────────
const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.body?._csrf || req.headers['x-csrf-token'] || req.query?._csrf,
});

// ── View engine ───────────────────────────────────────────────────────────
app.set('view engine', 'ejs');

// ── Inicializar banco master ──────────────────────────────────────────────
initializeDatabase();

// ── Arquivos estáticos (sem autenticação) ─────────────────────────────────
app.use(express.static('public'));

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Identificar tenant e injetar req.db ──────────────────────────────────
app.use(tenantMiddleware);

// ── Token CSRF para todas as views ────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  next();
});

// ── Variáveis globais para views ──────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuarioId
    ? { id: req.session.usuarioId, nome: req.session.nome, role: req.session.role }
    : null;
  next();
});

// ── CSRF: valida em POST/PUT/DELETE (exceto webhooks externos) ────────────
app.use((req, res, next) => {
  if (req.path === '/webhook/mercadopago' || req.path === '/webhook/sumup') return next();
  csrfSynchronisedProtection(req, res, next);
});

// ── Rotas de autenticação (públicas) ──────────────────────────────────────
app.use('/', authRoutes);

// ── Rotas protegidas ──────────────────────────────────────────────────────
app.use('/', produtoRoutes);
app.use('/', clienteRoutes);
app.use('/', bannerRoutes);
app.use('/', carrinhoRoutes);
app.use('/', checkoutRoutes);
app.use('/', configRoutes);

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
