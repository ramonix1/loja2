const twilio = require('twilio');

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

async function enviarSmsCodigo(telefone, codigo) {
  const client = getTwilioClient();
  if (!client) {
    console.warn('Twilio nÃ£o configurado  SMS nÃ£o enviado.');
    return false;
  }

  await client.messages.create({
    body: `LojÃ£o: seu cÃ³digo de redefiniÃ§Ã£o de senha Ã© ${codigo}. VÃ¡lido por ${process.env.TOKEN_EXPIRACAO_MINUTOS || 30} minutos.`,
    from: process.env.TWILIO_FROM,
    to: telefone,
  });

  return true;
}

const twilioDisponivel = () => !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

module.exports = { enviarSmsCodigo, twilioDisponivel };
