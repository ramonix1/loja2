const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarEmailRecuperacao(email, nome, token) {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const link = `${baseUrl}/redefinir-senha/${token}`;
  const expiracao = process.env.TOKEN_EXPIRACAO_MINUTOS || 30;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Lojão" <noreply@lojao.com.br>',
    to: email,
    subject: 'Redefinição de senha - Lojão',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Redefinição de senha</h2>
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <a href="${link}" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Redefinir minha senha
        </a>
        <p style="color:#666;font-size:0.9rem;">Este link expira em <strong>${expiracao} minutos</strong>.</p>
        <p style="color:#666;font-size:0.9rem;">Se você não solicitou a redefinição, ignore este email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin-top:32px;">
        <p style="color:#aaa;font-size:0.8rem;">Lojão — não responda este email.</p>
      </div>
    `,
  });
}

async function enviarEmailBoasVindas(email, nome) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Lojão" <noreply@lojao.com.br>',
    to: email,
    subject: 'Bem-vindo ao Lojão!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Bem-vindo ao Lojão!</h2>
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Sua conta foi criada com sucesso. Você já pode fazer login e aproveitar nossas ofertas.</p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Acessar minha conta
        </a>
      </div>
    `,
  });
}

module.exports = { enviarEmailRecuperacao, enviarEmailBoasVindas };
