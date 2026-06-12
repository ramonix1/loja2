import crypto from 'node:crypto';

/**
 * Assinatura de cookie compatível com `express-session` + `cookie-signature`.
 *
 * O legacy assina o sid como `s:` + `<sid>` + `.` + base64(HMAC-SHA256(sid)),
 * removendo o padding `=`. Reproduzir exatamente esse formato é o que permite
 * compartilhar a sessão (cookie `lojao.sid`) entre Express e Fastify.
 */
function hmac(value: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(value).digest('base64').replace(/=+$/, '');
}

/** Assina um sid no formato do express-session (`s:<sid>.<assinatura>`). */
export function signSid(sid: string, secret: string): string {
  return `s:${sid}.${hmac(sid, secret)}`;
}

/**
 * Verifica e extrai o sid de um cookie assinado. Retorna `false` se a
 * assinatura for inválida (comparação em tempo constante).
 */
export function unsignSid(signed: string, secret: string): string | false {
  if (!signed.startsWith('s:')) return false;

  const body = signed.slice(2);
  const dotIndex = body.lastIndexOf('.');
  if (dotIndex < 0) return false;

  const sid = body.slice(0, dotIndex);
  const expected = signSid(sid, secret);

  const a = Buffer.from(signed);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b) ? sid : false;
}

/** Gera um sid no mesmo formato do express-session (`uid-safe`: base64url, sem padding). */
export function generateSid(): string {
  return crypto.randomBytes(24).toString('base64url');
}
