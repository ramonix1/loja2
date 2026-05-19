const argon2 = require('argon2');
const crypto = require('crypto');
const db = require('../config/db');
const { enviarEmailRecuperacao, enviarEmailBoasVindas } = require('../services/emailService');
const { enviarSmsCodigo, twilioDisponivel } = require('../services/smsService');

const MAX_TENTATIVAS = parseInt(process.env.MAX_TENTATIVAS_LOGIN) || 5;
const BLOQUEIO_MIN = parseInt(process.env.BLOQUEIO_MINUTOS) || 15;
const TOKEN_EXP_MIN = parseInt(process.env.TOKEN_EXPIRACAO_MINUTOS) || 30;

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

// ── Login ──────────────────────────────────────────────────────────────────

exports.exibirLogin = (req, res) => {
  res.render('pages/login', { erro: null, info: req.session.info || null });
  delete req.session.info;
};

exports.processarLogin = async (req, res) => {
  const { email, senha } = req.body;
  const ip = req.ip;

  if (!email || !senha) {
    return res.render('pages/login', { erro: 'Preencha email e senha.', info: null });
  }

  try {
    // Verificar bloqueio por IP
    const bloqIp = await db.query(
      `SELECT * FROM tentativas_login WHERE ip = $1 AND bloqueado_ate > NOW()`,
      [ip]
    );
    if (bloqIp.rows.length > 0) {
      const minutos = Math.ceil((new Date(bloqIp.rows[0].bloqueado_ate) - new Date()) / 60000);
      return res.render('pages/login', {
        erro: `IP bloqueado por excesso de tentativas. Tente novamente em ${minutos} minuto(s).`,
        info: null,
      });
    }

    const resultado = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email.toLowerCase().trim()]
    );

    const usuario = resultado.rows[0];

    // Verificar bloqueio da conta
    if (usuario && usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
      const minutos = Math.ceil((new Date(usuario.bloqueado_ate) - new Date()) / 60000);
      return res.render('pages/login', {
        erro: `Conta bloqueada temporariamente. Tente novamente em ${minutos} minuto(s).`,
        info: null,
      });
    }

    const senhaCorreta = usuario ? await argon2.verify(usuario.senha_hash, senha) : false;

    if (!senhaCorreta) {
      await registrarTentativaFalha(ip, email);
      if (usuario) await incrementarFalhaUsuario(usuario.id);

      const tentativas = await contarTentativasIp(ip);
      const restantes = MAX_TENTATIVAS - tentativas;

      return res.render('pages/login', {
        erro: restantes > 0
          ? `Email ou senha incorretos. ${restantes} tentativa(s) restante(s).`
          : 'Conta bloqueada temporariamente por excesso de tentativas.',
        info: null,
      });
    }

    // Login bem-sucedido — limpar tentativas
    await limparTentativas(ip, usuario.id);

    // Regenerar sessão para prevenir session fixation
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    req.session.usuarioId = usuario.id;
    req.session.nome = usuario.nome;
    req.session.email = usuario.email;
    req.session.role = usuario.role;

    // Atualizar último acesso
    await db.query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = $1', [usuario.id]);

    const destino = req.session.redirecionarPara || (usuario.role === 'admin' ? '/admin' : '/');
    delete req.session.redirecionarPara;

    res.redirect(destino);
  } catch (err) {
    console.error('Erro no login:', err);
    res.render('pages/login', { erro: 'Erro interno. Tente novamente.', info: null });
  }
};

// ── Logout ─────────────────────────────────────────────────────────────────

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

// ── Recuperação de senha ───────────────────────────────────────────────────

exports.exibirRecuperarSenha = (req, res) => {
  res.render('pages/recuperar-senha', { erro: null, info: null, smsDisponivel: twilioDisponivel() });
};

exports.processarRecuperarSenha = async (req, res) => {
  const { email, telefone, canal } = req.body;
  const view = 'pages/recuperar-senha';
  const opts = { smsDisponivel: twilioDisponivel() };

  try {
    let usuario = null;

    if (canal === 'sms' && telefone) {
      const r = await db.query(
        'SELECT * FROM usuarios WHERE telefone = $1 AND ativo = true',
        [telefone.replace(/\D/g, '')]
      );
      usuario = r.rows[0];
    } else if (email) {
      const r = await db.query(
        'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
        [email.toLowerCase().trim()]
      );
      usuario = r.rows[0];
    }

    // Resposta genérica para não vazar se email/telefone existe
    const msgGenerica = canal === 'sms'
      ? 'Se o telefone estiver cadastrado, você receberá um SMS com o código.'
      : 'Se o email estiver cadastrado, você receberá um link de redefinição.';

    if (!usuario) {
      return res.render(view, { erro: null, info: msgGenerica, ...opts });
    }

    // Invalidar tokens anteriores
    await db.query(
      'UPDATE tokens_recuperacao SET usado = true WHERE usuario_id = $1 AND usado = false',
      [usuario.id]
    );

    const tokenBruto = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenBruto).digest('hex');
    const expiracao = new Date(Date.now() + TOKEN_EXP_MIN * 60 * 1000);

    await db.query(
      `INSERT INTO tokens_recuperacao (usuario_id, token_hash, canal, expira_em)
       VALUES ($1, $2, $3, $4)`,
      [usuario.id, tokenHash, canal === 'sms' ? 'sms' : 'email', expiracao]
    );

    if (canal === 'sms') {
      const codigo = tokenBruto.slice(0, 6).toUpperCase();
      // Sobrescrever token com versão curta para SMS
      await db.query('UPDATE tokens_recuperacao SET token_hash = $1 WHERE usuario_id = $2 AND usado = false AND expira_em = $3',
        [crypto.createHash('sha256').update(codigo).digest('hex'), usuario.id, expiracao]);
      await enviarSmsCodigo(
        (usuario.telefone.startsWith('+') ? '' : '+55') + usuario.telefone,
        codigo
      );
    } else {
      await enviarEmailRecuperacao(usuario.email, usuario.nome, tokenBruto);
    }

    res.render(view, { erro: null, info: msgGenerica, ...opts });
  } catch (err) {
    console.error('Erro na recuperação:', err);
    res.render(view, { erro: 'Erro ao enviar. Tente novamente.', info: null, ...opts });
  }
};

exports.exibirRedefinirSenha = async (req, res) => {
  const { token } = req.params;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const r = await db.query(
    `SELECT * FROM tokens_recuperacao
     WHERE token_hash = $1 AND usado = false AND expira_em > NOW()`,
    [tokenHash]
  );

  if (!r.rows[0]) {
    return res.render('pages/error', { message: 'Link inválido ou expirado. Solicite um novo.' });
  }

  res.render('pages/redefinir-senha', { token, erro: null });
};

exports.processarRedefinirSenha = async (req, res) => {
  const { token } = req.params;
  const { senha, confirmacao } = req.body;

  if (!senha || senha.length < 8) {
    return res.render('pages/redefinir-senha', { token, erro: 'A senha deve ter no mínimo 8 caracteres.' });
  }
  if (senha !== confirmacao) {
    return res.render('pages/redefinir-senha', { token, erro: 'As senhas não coincidem.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const r = await db.query(
      `SELECT * FROM tokens_recuperacao
       WHERE token_hash = $1 AND usado = false AND expira_em > NOW()`,
      [tokenHash]
    );

    if (!r.rows[0]) {
      return res.render('pages/error', { message: 'Link inválido ou expirado. Solicite um novo.' });
    }

    const senhaHash = await argon2.hash(senha, ARGON2_OPTIONS);

    await db.query('UPDATE usuarios SET senha_hash = $1, bloqueado_ate = NULL, tentativas_falha = 0 WHERE id = $2',
      [senhaHash, r.rows[0].usuario_id]);

    await db.query('UPDATE tokens_recuperacao SET usado = true WHERE id = $1', [r.rows[0].id]);

    req.session.info = 'Senha redefinida com sucesso! Faça login.';
    res.redirect('/login');
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.render('pages/redefinir-senha', { token, erro: 'Erro interno. Tente novamente.' });
  }
};

// ── Registro (admin cria usuários) ────────────────────────────────────────

exports.criarUsuario = async (req, res) => {
  const { nome, email, senha, role, telefone } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }
  if (senha.length < 8) {
    return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres.' });
  }

  try {
    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existe.rows[0]) return res.status(409).json({ erro: 'Email já cadastrado.' });

    const senhaHash = await argon2.hash(senha, ARGON2_OPTIONS);
    await db.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role, telefone)
       VALUES ($1, $2, $3, $4, $5)`,
      [nome, email.toLowerCase().trim(), senhaHash, role || 'usuario', telefone || null]
    );

    try { await enviarEmailBoasVindas(email, nome); } catch (_) {}

    res.json({ sucesso: true, mensagem: 'Usuário criado com sucesso.' });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
};

// ── Helpers internos ──────────────────────────────────────────────────────

async function registrarTentativaFalha(ip, email) {
  await db.query(
    `INSERT INTO tentativas_login (ip, email, tentativas, bloqueado_ate)
     VALUES ($1, $2, 1, NULL)
     ON CONFLICT (ip) DO UPDATE
     SET tentativas = tentativas_login.tentativas + 1,
         email = $2,
         bloqueado_ate = CASE
           WHEN tentativas_login.tentativas + 1 >= $3
           THEN NOW() + ($4 || ' minutes')::INTERVAL
           ELSE NULL
         END,
         updated_at = NOW()`,
    [ip, email, MAX_TENTATIVAS, BLOQUEIO_MIN]
  );
}

async function contarTentativasIp(ip) {
  const r = await db.query('SELECT tentativas FROM tentativas_login WHERE ip = $1', [ip]);
  return r.rows[0] ? r.rows[0].tentativas : 0;
}

async function incrementarFalhaUsuario(usuarioId) {
  await db.query(
    `UPDATE usuarios SET
       tentativas_falha = tentativas_falha + 1,
       bloqueado_ate = CASE
         WHEN tentativas_falha + 1 >= $2
         THEN NOW() + ($3 || ' minutes')::INTERVAL
         ELSE NULL
       END
     WHERE id = $1`,
    [usuarioId, MAX_TENTATIVAS, BLOQUEIO_MIN]
  );
}

async function limparTentativas(ip, usuarioId) {
  await db.query('DELETE FROM tentativas_login WHERE ip = $1', [ip]);
  if (usuarioId) {
    await db.query('UPDATE usuarios SET tentativas_falha = 0, bloqueado_ate = NULL WHERE id = $1', [usuarioId]);
  }
}
