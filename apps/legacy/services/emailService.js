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
    from: process.env.EMAIL_FROM || '"LojÃ£o" <noreply@lojao.com.br>',
    to: email,
    subject: 'RedefiniÃ§Ã£o de senha - LojÃ£o',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">RedefiniÃ§Ã£o de senha</h2>
        <p>OlÃ¡, <strong>${nome}</strong>!</p>
        <p>Recebemos uma solicitaÃ§Ã£o para redefinir a senha da sua conta.</p>
        <p>Clique no botÃ£o abaixo para criar uma nova senha:</p>
        <a href="${link}" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Redefinir minha senha
        </a>
        <p style="color:#666;font-size:0.9rem;">Este link expira em <strong>${expiracao} minutos</strong>.</p>
        <p style="color:#666;font-size:0.9rem;">Se vocÃª nÃ£o solicitou a redefiniÃ§Ã£o, ignore este email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin-top:32px;">
        <p style="color:#aaa;font-size:0.8rem;">LojÃ£o  nÃ£o responda este email.</p>
      </div>
    `,
  });
}

async function enviarEmailBoasVindas(email, nome) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"LojÃ£o" <noreply@lojao.com.br>',
    to: email,
    subject: 'Bem-vindo ao LojÃ£o!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Bem-vindo ao LojÃ£o!</h2>
        <p>OlÃ¡, <strong>${nome}</strong>!</p>
        <p>Sua conta foi criada com sucesso. VocÃª jÃ¡ pode fazer login e aproveitar nossas ofertas.</p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Acessar minha conta
        </a>
      </div>
    `,
  });
}

async function enviarNotificacaoPedidoPago({ lojaNome, lojaEmail, pedido, itens }) {
  if (!lojaEmail) return;

  const fmt = v => Number(v).toFixed(2).replace('.', ',');
  const metodoLabel = { pix: 'PIX', boleto: 'Boleto', cartao: 'CartÃ£o de crÃ©dito', teste: 'Teste', sumup_online: 'SumUp' };
  const itensHtml = itens.map(i =>
    `<tr>
       <td style="padding:5px 0;color:#374151;font-size:14px;">${i.quantidade}x ${i.nome_produto}</td>
       <td style="padding:5px 0;text-align:right;font-weight:700;font-size:14px;">R$ ${fmt(i.subtotal)}</td>
     </tr>`
  ).join('');

  const baseUrl = process.env.APP_URL || 'http://localhost:3000';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"${lojaNome}" <noreply@lojao.com.br>`,
    to: lojaEmail,
    subject: `Novo pedido pago #${pedido.id}  ${lojaNome}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:#16a34a;padding:24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:20px;">Novo pedido pago!</h2>
          <p style="color:#dcfce7;margin:6px 0 0;font-size:14px;">Pedido #${pedido.id} foi confirmado</p>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            ${itensHtml}
            <tr><td colspan="2"><hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0;"></td></tr>
            <tr>
              <td style="font-size:15px;font-weight:700;">Total</td>
              <td style="text-align:right;font-size:16px;font-weight:700;color:#16a34a;">R$ ${fmt(pedido.total)}</td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#6b7280;margin-bottom:20px;">
            <tr><td>Cliente</td><td style="text-align:right;color:#111;font-weight:600;">${pedido.nome_entrega}</td></tr>
            <tr><td>E-mail</td><td style="text-align:right;color:#111;">${pedido.email_entrega}</td></tr>
            <tr><td>Pagamento</td><td style="text-align:right;color:#111;">${metodoLabel[pedido.metodo_pagamento] || pedido.metodo_pagamento}</td></tr>
            <tr><td>EndereÃ§o</td><td style="text-align:right;color:#111;">${pedido.logradouro}, ${pedido.numero}  ${pedido.cidade}/${pedido.estado}</td></tr>
          </table>

          <a href="${baseUrl}/admin/pedidos/${pedido.id}"
             style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">
            Ver pedido no painel
          </a>
        </div>
        <p style="color:#aaa;font-size:11px;margin-top:12px;">Enviado por ${lojaNome}</p>
      </div>
    `,
  });
}

async function enviarEmailRastreio({ lojaNome, lojaEmail, pedido, codigoRastreio }) {
  if (!pedido.email_entrega) return;

  const fmt = v => Number(v).toFixed(2).replace('.', ',');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"${lojaNome}" <noreply@lojao.com.br>`,
    to: pedido.email_entrega,
    subject: `Seu pedido #${pedido.id} foi enviado  ${lojaNome}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
        <div style="background:#2563eb;padding:24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:20px;">Seu pedido estÃ¡ a caminho!</h2>
          <p style="color:#bfdbfe;margin:6px 0 0;font-size:14px;">Pedido #${pedido.id}</p>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:15px;">OlÃ¡, <strong>${pedido.nome_entrega}</strong>!</p>
          <p style="font-size:14px;color:#374151;">Seu pedido foi enviado e estÃ¡ a caminho do endereÃ§o abaixo.</p>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
            <div style="font-size:12px;color:#1d4ed8;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;">CÃ³digo de rastreio</div>
            <div style="font-size:22px;font-weight:800;color:#1e3a8a;letter-spacing:.1em;">${codigoRastreio}</div>
          </div>

          <p style="font-size:13px;color:#6b7280;">
            Rastreie seu pedido em <a href="https://www.correios.com.br/rastreamento" style="color:#2563eb;">correios.com.br</a>
            ou no site da transportadora informando o cÃ³digo acima.
          </p>

          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-top:16px;font-size:13px;color:#374151;">
            <strong>EndereÃ§o de entrega:</strong><br>
            ${pedido.logradouro}, ${pedido.numero}${pedido.complemento ? ', ' + pedido.complemento : ''}<br>
            ${pedido.bairro}  ${pedido.cidade}/${pedido.estado}  CEP ${pedido.cep}
          </div>

          <p style="font-size:13px;color:#6b7280;margin-top:20px;">Total do pedido: <strong>R$ ${fmt(pedido.total)}</strong></p>
        </div>
        <p style="color:#aaa;font-size:11px;margin-top:12px;">Enviado por ${lojaNome}</p>
      </div>
    `,
  });
}

async function enviarEmailBoasVindasPlataforma({ email, nome, empresa, slug, senha, appUrl }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@plataforma.com',
    to: email,
    subject: `Sua loja ${empresa} está pronta!`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1e40af;margin-bottom:8px;">Bem-vindo, ${nome}!</h2>
        <p style="color:#374151;">Sua loja <strong>${empresa}</strong> foi criada e já está no ar.</p>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;">DADOS DE ACESSO</p>
          <p style="margin:4px 0;color:#111827;"><strong>Endereço:</strong> ${appUrl.replace('localhost:3000', slug + '.sualoja.com.br')}</p>
          <p style="margin:4px 0;color:#111827;"><strong>Email:</strong> ${email}</p>
          <p style="margin:4px 0;color:#111827;"><strong>Senha temporária:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${senha}</code></p>
        </div>
        <p style="color:#6b7280;font-size:13px;">Altere sua senha após o primeiro acesso. Qualquer dúvida, responda este email.</p>
      </div>
    `,
  });
}

module.exports = { enviarEmailRecuperacao, enviarEmailBoasVindas, enviarNotificacaoPedidoPago, enviarEmailRastreio, enviarEmailBoasVindasPlataforma };
