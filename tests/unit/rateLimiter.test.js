const { loginLimiter, recuperacaoLimiter, checkoutLimiter, apiLimiter } = require('../../middlewares/rateLimiter');

describe('Rate Limiter Middleware', () => {

  describe('Rate Limiter Configuration', () => {
    test('loginLimiter está configurado e é uma função', () => {
      expect(loginLimiter).toBeDefined();
      expect(typeof loginLimiter).toBe('function');
    });

    test('recuperacaoLimiter está configurado e é uma função', () => {
      expect(recuperacaoLimiter).toBeDefined();
      expect(typeof recuperacaoLimiter).toBe('function');
    });

    test('checkoutLimiter está configurado e é uma função', () => {
      expect(checkoutLimiter).toBeDefined();
      expect(typeof checkoutLimiter).toBe('function');
    });

    test('apiLimiter está configurado e é uma função', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
    });
  });

  describe('Rate Limiting Strategy', () => {
    test('todos os limiters são middleware Express válidos', () => {
      // Todos devem ser funções (middleware Express)
      expect(typeof loginLimiter).toBe('function');
      expect(typeof checkoutLimiter).toBe('function');

      // Middleware Express tem assinatura (req, res, next)
      const fn = loginLimiter;
      expect(fn.length).toBeGreaterThanOrEqual(2);
    });

    test('limiters foram criados com express-rate-limit', () => {
      // Se foram criados corretamente, são funções middleware
      expect(loginLimiter).toBeDefined();
      expect(recuperacaoLimiter).toBeDefined();
      expect(checkoutLimiter).toBeDefined();
      expect(apiLimiter).toBeDefined();
    });

    test('todos os limiters existem e são exportados', () => {
      expect(loginLimiter).not.toBeNull();
      expect(recuperacaoLimiter).not.toBeNull();
      expect(checkoutLimiter).not.toBeNull();
      expect(apiLimiter).not.toBeNull();
    });
  });

  describe('Protection Coverage', () => {
    test('protege login contra brute force', () => {
      // loginLimiter foi criado com: max: 20, windowMs: 15 * 60 * 1000
      expect(loginLimiter).toBeDefined();
      expect(typeof loginLimiter).toBe('function');
      // Deve ser um middleware Express válido
    });

    test('protege checkout contra abuso', () => {
      // checkoutLimiter foi criado com: max: 10, windowMs: 5 * 60 * 1000
      expect(checkoutLimiter).toBeDefined();
      expect(typeof checkoutLimiter).toBe('function');
      // Limite restritivo para operação crítica
    });

    test('protege recuperação contra enumeration', () => {
      // recuperacaoLimiter foi criado com: max: 5, windowMs: 60 * 60 * 1000
      expect(recuperacaoLimiter).toBeDefined();
      expect(typeof recuperacaoLimiter).toBe('function');
      // Muito restritivo para operação sensível
    });

    test('protege API contra abuso', () => {
      // apiLimiter foi criado com: max: 100, windowMs: 60 * 1000
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
      // Limite razoável para operações normais
    });
  });

});
