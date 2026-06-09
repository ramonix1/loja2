const argon2 = require('argon2');
const crypto = require('crypto');
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

// €€ Login €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

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
    const bloqIp = await req.db.query(
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

    const resultado = await req.db.query(
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
      await registrarTentativaFalha(req.db, ip, email);
      if (usuario) await incrementarFalhaUsuario(req.db, usuario.id);

      const tentativas = await contarTentativasIp(req.db, ip);
      const restantes = MAX_TENTATIVAS - tentativas;

      return res.render('pages/login', {
        erro: restantes > 0
          ? `Email ou senha incorretos. ${restantes} tentativa(s) restante(s).`
          : 'Conta bloqueada temporariamente por excesso de tentativas.',
        info: null,
      });
    }

    // Login bem-sucedido € limpar tentativas
    await limparTentativas(req.db, ip, usuario.id);

    // Preservar tenantSlug antes de regenerar (regenerate apaga toda a sessÃ£o)
    const tenantSlug = req.session.tenantSlug;

    // Regenerar sessÃ£o para prevenir session fixation
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    if (tenantSlug) req.session.tenantSlug = tenantSlug;
    req.session.usuarioId = usuario.id;
    req.session.nome = usuario.nome;
    req.session.email = usuario.email;
    req.session.role = usuario.role;

    // Salvar sessÃ£o antes de redirecionar
    await new Promise((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    // Atualizar Ãºltimo acesso
    await req.db.query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = $1', [usuario.id]);

    const destino = req.session.redirecionarPara || (usuario.role === 'admin' ? '/admin' : '/');
    delete req.session.redirecionarPara;

    res.redirect(destino);
  } catch (err) {
    console.error('Erro no login:', err);
    res.render('pages/login', { erro: 'Erro interno. Tente novamente.', info: null });
  }
};

// €€ Logout €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

exports.logout = (req, res) => {
  // Preservar tenantSlug para nÃ£o perder o contexto de dev apÃ³s logout
  const tenantSlug = req.session.tenantSlug;
  req.session.usuarioId = null;
  req.session.nome = null;
  req.session.email = null;
  req.session.role = null;
  req.session.redirecionarPara = null;
  req.session.info = null;
  if (tenantSlug) req.session.tenantSlug = tenantSlug;
  req.session.save(() => res.redirect('/login'));
};

// €€ RecuperaÃ§Ã£o de senha €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

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
      const r = await req.db.query(
        'SELECT * FROM usuarios WHERE telefone = $1 AND ativo = true',
        [telefone.replace(/\D/g, '')]
      );
      usuario = r.rows[0];
    } else if (email) {
      const r = await req.db.query(
        'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
        [email.toLowerCase().trim()]
      );
      usuario = r.rows[0];
    }

    // Resposta genÃ©rica para nÃ£o vazar se email/telefone existe
    const msgGenerica = canal === 'sms'
      ? 'Se o telefone estiver cadastrado, vocÃª receberÃ¡ um SMS com o cÃ³digo.'
      : 'Se o email estiver cadastrado, vocÃª receberÃ¡ um link de redefiniÃ§Ã£o.';

    if (!usuario) {
      return res.render(view, { erro: null, info: msgGenerica, ...opts });
    }

    // Invalidar tokens anteriores
    await req.db.query(
      'UPDATE tokens_recuperacao SET usado = true WHERE usuario_id = $1 AND usado = false',
      [usuario.id]
    );

    const tokenBruto = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenBruto).digest('hex');
    const expiracao = new Date(Date.now() + TOKEN_EXP_MIN * 60 * 1000);

    await req.db.query(
      `INSERT INTO tokens_recuperacao (usuario_id, token_hash, canal, expira_em)
       VALUES ($1, $2, $3, $4)`,
      [usuario.id, tokenHash, canal === 'sms' ? 'sms' : 'email', expiracao]
    );

    if (canal === 'sms') {
      const codigo = tokenBruto.slice(0, 6).toUpperCase();
      // Sobrescrever token com versÃ£o curta para SMS
      await req.db.query('UPDATE tokens_recuperacao SET token_hash = $1 WHERE usuario_id = $2 AND usado = false AND expira_em = $3',
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
    console.error('Erro na recuperaÃ§Ã£o:', err);
    res.render(view, { erro: 'Erro ao enviar. Tente novamente.', info: null, ...opts });
  }
};

exports.exibirRedefinirSenha = async (req, res) => {
  const { token } = req.params;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const r = await req.db.query(
    `SELECT * FROM tokens_recuperacao
     WHERE token_hash = $1 AND usado = false AND expira_em > NOW()`,
    [tokenHash]
  );

  if (!r.rows[0]) {
    return res.render('pages/error', { message: 'Link invÃ¡lido ou expirado. Solicite um novo.' });
  }

  res.render('pages/redefinir-senha', { token, erro: null });
};

exports.processarRedefinirSenha = async (req, res) => {
  const { token } = req.params;
  const { senha, confirmacao } = req.body;

  if (!senha || senha.length < 8) {
    return res.render('pages/redefinir-senha', { token, erro: 'A senha deve ter no mÃnimo 8 caracteres.' });
  }
  if (senha !== confirmacao) {
    return res.render('pages/redefinir-senha', { token, erro: 'As senhas nÃ£o coincidem.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const r = await req.db.query(
      `SELECT * FROM tokens_recuperacao
       WHERE token_hash = $1 AND usado = false AND expira_em > NOW()`,
      [tokenHash]
    );

    if (!r.rows[0]) {
      return res.render('pages/error', { message: 'Link invÃ¡lido ou expirado. Solicite um novo.' });
    }

    const senhaHash = await argon2.hash(senha, ARGON2_OPTIONS);

    await req.db.query('UPDATE usuarios SET senha_hash = $1, bloqueado_ate = NULL, tentativas_falha = 0 WHERE id = $2',
      [senhaHash, r.rows[0].usuario_id]);

    await req.db.query('UPDATE tokens_recuperacao SET usado = true WHERE id = $1', [r.rows[0].id]);

    req.session.info = 'Senha redefinida com sucesso! FaÃ§a login.';
    res.redirect('/login');
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.render('pages/redefinir-senha', { token, erro: 'Erro interno. Tente novamente.' });
  }
};

// €€ Cadastro pÃºblico (usuÃ¡rio comum) €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

exports.exibirCadastro = (req, res) => {
  res.render('pages/cadastro', { erros: [], dados: {} });
};

exports.processarCadastro = async (req, res) => {
  const {
    nome, email, senha, confirmacao, telefone,
    cep, logradouro, numero, complemento, bairro, cidade, estado,
  } = req.body;

  const erros = [];
  const dados = req.body;

  if (!nome || nome.trim().length < 3) erros.push('Nome deve ter pelo menos 3 caracteres.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('Email invÃ¡lido.');
  if (!senha || senha.length < 8) erros.push('Senha deve ter no mÃnimo 8 caracteres.');
  if (senha !== confirmacao) erros.push('As senhas nÃ£o coincidem.');
  if (!telefone || telefone.replace(/\D/g, '').length < 10) erros.push('Telefone invÃ¡lido.');
  if (!cep || cep.replace(/\D/g, '').length !== 8) erros.push('CEP invÃ¡lido.');
  if (!logradouro) erros.push('Logradouro obrigatÃ³rio.');
  if (!numero) erros.push('NÃºmero obrigatÃ³rio.');
  if (!bairro) erros.push('Bairro obrigatÃ³rio.');
  if (!cidade) erros.push('Cidade obrigatÃ³ria.');
  if (!estado) erros.push('Estado obrigatÃ³rio.');

  if (erros.length) return res.render('pages/cadastro', { erros, dados });

  try {
    const existe = await req.db.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (existe.rows[0]) {
      return res.render('pages/cadastro', { erros: ['Este email jÃ¡ estÃ¡ cadastrado.'], dados });
    }

    const senhaHash = await argon2.hash(senha, ARGON2_OPTIONS);
    const telLimpo = telefone.replace(/\D/g, '');
    const cepLimpo = cep.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');

    await req.db.query(
      `INSERT INTO usuarios
         (nome, email, senha_hash, role, telefone, cep, logradouro, numero, complemento, bairro, cidade, estado)
       VALUES ($1,$2,$3,'usuario',$4,$5,$6,$7,$8,$9,$10,$11)`,
      [nome.trim(), email.toLowerCase().trim(), senhaHash, telLimpo,
       cepLimpo, logradouro.trim(), numero.trim(), complemento?.trim() || null,
       bairro.trim(), cidade.trim(), estado.toUpperCase()]
    );

    try { await enviarEmailBoasVindas(email, nome); } catch (_) {}

    req.session.info = 'Cadastro realizado! FaÃ§a login para continuar.';
    res.redirect('/login');
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.render('pages/cadastro', { erros: ['Erro interno. Tente novamente.'], dados });
  }
};

// €€ GestÃ£o de admins (tela de permissÃµes) €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

exports.exibirPermissoes = async (req, res) => {
  const admins = await req.db.query(
    "SELECT id, nome, email, cpf, ativo, ultimo_acesso, created_at FROM usuarios WHERE role = 'admin' ORDER BY created_at DESC"
  );
  res.render('pages/admin-permissoes', { admins: admins.rows, erro: null, sucesso: null, activePage: 'permissoes' });
};

exports.criarAdmin = async (req, res) => {
  const { nome, email, senha, cpf } = req.body;

  const erros = [];
  if (!nome || nome.trim().length < 3) erros.push('Nome invÃ¡lido.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('Email invÃ¡lido.');
  if (!senha || senha.length < 8) erros.push('Senha deve ter no mÃnimo 8 caracteres.');
  if (cpf && !validarCPF(cpf)) erros.push('CPF invÃ¡lido.');

  if (erros.length) {
    const admins = await req.db.query("SELECT id, nome, email, cpf, ativo, ultimo_acesso, created_at FROM usuarios WHERE role = 'admin' ORDER BY created_at DESC");
    return res.render('pages/admin-permissoes', { admins: admins.rows, erro: erros.join(' '), sucesso: null, activePage: 'permissoes' });
  }

  try {
    const existe = await req.db.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existe.rows[0]) {
      const admins = await req.db.query("SELECT id, nome, email, cpf, ativo, ultimo_acesso, created_at FROM usuarios WHERE role = 'admin' ORDER BY created_at DESC");
      return res.render('pages/admin-permissoes', { admins: admins.rows, erro: 'Email jÃ¡ cadastrado.', sucesso: null, activePage: 'permissoes' });
    }

    const cpfLimpo = cpf ? cpf.replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : null;
    const senhaHash = await argon2.hash(senha, ARGON2_OPTIONS);

    await req.db.query(
      "INSERT INTO usuarios (nome, email, senha_hash, role, cpf) VALUES ($1,$2,$3,'admin',$4)",
      [nome.trim(), email.toLowerCase().trim(), senhaHash, cpfLimpo]
    );

    const admins = await req.db.query("SELECT id, nome, email, cpf, ativo, ultimo_acesso, created_at FROM usuarios WHERE role = 'admin' ORDER BY created_at DESC");
    res.render('pages/admin-permissoes', { admins: admins.rows, erro: null, sucesso: 'Admin criado com sucesso.', activePage: 'permissoes' });
  } catch (err) {
    console.error('Erro ao criar admin:', err);
    const admins = await req.db.query("SELECT id, nome, email, cpf, ativo, ultimo_acesso, created_at FROM usuarios WHERE role = 'admin' ORDER BY created_at DESC");
    res.render('pages/admin-permissoes', { admins: admins.rows, erro: 'Erro interno.', sucesso: null, activePage: 'permissoes' });
  }
};

exports.toggleAdmin = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.session.usuarioId) {
    return res.redirect('/admin/permissoes');
  }
  await req.db.query('UPDATE usuarios SET ativo = NOT ativo WHERE id = $1 AND role = $2', [id, 'admin']);
  res.redirect('/admin/permissoes');
};

exports.excluirAdmin = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.session.usuarioId) {
    return res.redirect('/admin/permissoes');
  }
  await req.db.query("DELETE FROM usuarios WHERE id = $1 AND role = 'admin'", [id]);
  res.redirect('/admin/permissoes');
};

// €€ Helpers internos €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

function validarCPF(cpf) {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(n[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(n[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(n[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(n[10]);
}

// €€ Helpers internos €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€

async function registrarTentativaFalha(db, ip, email) {
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

async function contarTentativasIp(db, ip) {
  const r = await db.query('SELECT tentativas FROM tentativas_login WHERE ip = $1', [ip]);
  return r.rows[0] ? r.rows[0].tentativas : 0;
}

async function incrementarFalhaUsuario(db, usuarioId) {
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

async function limparTentativas(db, ip, usuarioId) {
  await db.query('DELETE FROM tentativas_login WHERE ip = $1', [ip]);
  if (usuarioId) {
    await db.query('UPDATE usuarios SET tentativas_falha = 0, bloqueado_ate = NULL WHERE id = $1', [usuarioId]);
  }
}
