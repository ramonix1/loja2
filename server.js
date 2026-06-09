require('dotenv').config();

const http = require('http');
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
const agendaRoutes = require('./routes/agendaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const aparenciaRoutes = require('./routes/aparenciaRoutes');
const freteRoutes = require('./routes/freteRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');
const tenantManagementRoutes = require('./routes/tenantManagementRoutes');
const billingRoutes = require('./routes/billingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const compradorRoutes = require('./routes/compradorRoutes');
const initializeDatabase = require('./config/init-db');
const socketio = require('./config/socketio');

const tenantMiddleware = require('./middlewares/tenant');
const { icon } = require('./utils/iconHelper');

const app = express();

// NecessÃ¡rio para funcionar corretamente atrÃ¡s de proxies (ngrok, nginx, etc.)
app.set('trust proxy', 1);

//  SeguranÃ§a: headers HTTP 
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'ws:', 'wss:', 'https://viacep.com.br', 'https://api.stripe.com', 'https://hooks.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.tailwindcss.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://placehold.co', 'https://*.stripe.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://js.stripe.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
}));

//  ProteÃ§Ã£o adicional contra ataques 
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

//  SessÃ£o  armazenada no banco MASTER (compartilhado entre tenants) 
const sessionMiddleware = session({
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
});
app.use(sessionMiddleware);

//  CSRF (Synchronizer Token Pattern) 
const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.body?._csrf || req.headers['x-csrf-token'] || req.query?._csrf,
});

//  View engine 
app.set('view engine', 'ejs');


//  Inicializar banco master 
initializeDatabase();

//  Arquivos estÃ¡ticos (sem autenticaÃ§Ã£o) 
app.use(express.static('public'));

//  Body parsers 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//  Painel de gestÃ£o de tenants (dev only, antes do tenant middleware) 
app.use('/_tenants', tenantManagementRoutes);

//  Rotas de Billing (Super Admin + APIs) 
app.use('/', billingRoutes);

//  Identificar tenant e injetar req.db 
app.use(tenantMiddleware);

//  Token CSRF para todas as views 
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  next();
});

//  VariÃ¡veis globais para views 
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuarioId
    ? { id: req.session.usuarioId, nome: req.session.nome, role: req.session.role }
    : null;
  res.locals.icon = icon;
  next();
});

//  Identidade visual da loja (injetada em todas as views) 
app.use(async (req, res, next) => {
  const defaults = { nome: 'LojÃ£o', slogan: '', logo: '', favicon: '', cor_primaria: '#2563eb', rodape: '', email: '', whatsapp: '' };
  if (!req.db) { res.locals.loja = defaults; return next(); }
  try {
    const r = await req.db.query("SELECT chave, valor FROM configuracoes WHERE chave LIKE 'loja_%'");
    const cfg = {};
    r.rows.forEach(row => { cfg[row.chave] = row.valor; });
    res.locals.loja = {
      nome:          cfg.loja_nome          || 'LojÃ£o',
      slogan:        cfg.loja_slogan        || '',
      logo:          cfg.loja_logo          || '',
      favicon:       cfg.loja_favicon       || '',
      cor_primaria:  cfg.loja_cor_primaria  || '#2563eb',
      rodape:        cfg.loja_rodape        || '',
      email:         cfg.loja_email         || '',
      whatsapp:      cfg.loja_whatsapp      || '',
    };
  } catch { res.locals.loja = defaults; }
  next();
});

//  CSRF: valida em POST/PUT/DELETE (exceto webhooks externos) 
app.use((req, res, next) => {
  if (req.path === '/webhook/stripe' || req.path === '/webhook/sumup') return next();
  csrfSynchronisedProtection(req, res, next);
});

//  Rotas de autenticaÃ§Ã£o (pÃºblicas) 
app.use('/', authRoutes);

//  Painel de Faturamento do Cliente 
app.get('/dashboard/billing', async (req, res) => {
  try {
    if (!req.session.usuarioId) {
      return res.redirect('/login');
    }

    const BillingService = require('./services/billingService');
    const tenantId = req.session.tenant_id;

    // Buscar dados de billing
    const [billing, invoices] = await Promise.all([
      BillingService.getBillingReport(tenantId).catch(() => ({})),
      BillingService.listInvoices(tenantId).catch(() => [])
    ]);

    res.render('pages/cliente-billing', {
      billing,
      invoices,
      usuario: req.session.usuarioId ? { id: req.session.usuarioId, nome: req.session.nome } : null
    });
  } catch (err) {
    console.error('Erro ao carregar painel de billing:', err);
    res.status(500).render('pages/error', { message: 'Erro ao carregar dados de faturamento' });
  }
});

//  Rotas protegidas 
app.use('/', produtoRoutes);
app.use('/', clienteRoutes);
app.use('/', bannerRoutes);
app.use('/', carrinhoRoutes);
app.use('/', checkoutRoutes);
app.use('/', configRoutes);
app.use('/', agendaRoutes);
app.use('/', categoriaRoutes);
app.use('/', aparenciaRoutes);
app.use('/', freteRoutes);
app.use('/', relatorioRoutes);
app.use('/', chatRoutes);
app.use('/', compradorRoutes);

//  404 
app.use((req, res) => {
  if (!res.locals.loja) res.locals.loja = { nome: 'LojÃ£o', slogan: '', logo: '', favicon: '', cor_primaria: '#2563eb', rodape: '', email: '', whatsapp: '' };
  res.status(404).render('pages/error', { message: 'PÃ¡gina nÃ£o encontrada' });
});

//  Error handler 
app.use((err, req, res, next) => {
  if (res.headersSent) return res.end();
  if (!res.locals.loja) res.locals.loja = { nome: 'LojÃ£o', slogan: '', logo: '', favicon: '', cor_primaria: '#2563eb', rodape: '', email: '', whatsapp: '' };
  if (err.code === 'EBADCSRFTOKEN' || err.status === 403) {
    return res.status(403).render('pages/error', { message: 'Token de seguranÃ§a invÃ¡lido. Recarregue a pÃ¡gina.' });
  }
  console.error('Erro nÃ£o tratado:', err);
  res.status(500).render('pages/error', { message: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
socketio.init(httpServer, sessionMiddleware);
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
