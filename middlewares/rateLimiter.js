const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { erro: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const recuperacaoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { erro: 'Muitas solicitações de recuperação. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, recuperacaoLimiter };
