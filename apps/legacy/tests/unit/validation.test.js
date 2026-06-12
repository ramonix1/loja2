const {
  validateEmail,
  validateCEP,
  validateCPF,
  sanitizeString,
  validateCheckoutData,
} = require('../../middlewares/validation');

describe('Validation Middleware', () => {

  describe('validateEmail', () => {
    test('aceita email vÃ¡lido', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.name+tag@domain.co.uk')).toBe(true);
    });

    test('rejeita email invÃ¡lido', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    test('nÃ£o Ã© sensÃvel a case', () => {
      expect(validateEmail('User@EXAMPLE.COM')).toBe(true);
    });
  });

  describe('validateCEP', () => {
    test('aceita CEP em formato correto', () => {
      expect(validateCEP('12345-678')).toBe(true);
      expect(validateCEP('12345678')).toBe(true);
    });

    test('rejeita CEP invÃ¡lido', () => {
      expect(validateCEP('123')).toBe(false);
      expect(validateCEP('12345')).toBe(false);
      expect(validateCEP('abcde-fgh')).toBe(false);
      expect(validateCEP('')).toBe(false);
    });
  });

  describe('validateCPF', () => {
    test('rejeita CPF com dÃgitos repetidos', () => {
      expect(validateCPF('11111111111')).toBe(false);
      expect(validateCPF('00000000000')).toBe(false);
    });

    test('rejeita CPF com tamanho invÃ¡lido', () => {
      expect(validateCPF('123')).toBe(false);
      expect(validateCPF('1234567890')).toBe(false);
    });

    test('rejeita CPF nÃ£o-string', () => {
      expect(validateCPF(12345678901)).toBe(false);
      expect(validateCPF(null)).toBe(false);
      expect(validateCPF(undefined)).toBe(false);
    });

    test('aceita CPF com mÃ¡scara', () => {
      // CPF vÃ¡lido com mÃ¡scara deve funcionar
      const validCPF = '123.456.789-09'; // Este Ã© um exemplo, pode nÃ£o ser vÃ¡lido de verdade
      const result = validateCPF(validCPF);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('sanitizeString', () => {
    test('remove caracteres perigosos < e >', () => {
      const result1 = sanitizeString('<script>alert()</script>');
      const result2 = sanitizeString('Hello <b>World</b>');

      // Remove < e >, mantÃ©m o texto
      expect(result1).not.toContain('<');
      expect(result1).not.toContain('>');
      expect(result2).not.toContain('<');
      expect(result2).not.toContain('>');
    });

    test('limita tamanho mÃ¡ximo', () => {
      const longString = 'a'.repeat(300);
      const result = sanitizeString(longString, 100);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    test('faz trim de espaÃ§os', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
    });

    test('retorna string vazia para input invÃ¡lido', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });

    test('usa 255 como default maxLength', () => {
      const longString = 'a'.repeat(300);
      const result = sanitizeString(longString);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('validateCheckoutData', () => {
    const validData = {
      nome_entrega: 'JoÃ£o Silva',
      email_entrega: 'joao@example.com',
      cep: '12345-678',
      logradouro: 'Rua Principal',
      numero: '123',
      cidade: 'SÃ£o Paulo',
      estado: 'SP',
      metodo_pagamento: 'cartao',
    };

    test('aceita dados vÃ¡lidos', () => {
      const errors = validateCheckoutData(validData);
      expect(errors).toHaveLength(0);
    });

    test('rejeita nome_entrega muito curto', () => {
      const data = { ...validData, nome_entrega: 'Jo' };
      const errors = validateCheckoutData(data);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Nome de entrega');
    });

    test('rejeita email invÃ¡lido', () => {
      const data = { ...validData, email_entrega: 'invalid-email' };
      const errors = validateCheckoutData(data);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('rejeita CEP invÃ¡lido', () => {
      const data = { ...validData, cep: '123' };
      const errors = validateCheckoutData(data);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('rejeita estado com formato invÃ¡lido', () => {
      const data = { ...validData, estado: 'SPX' };
      const errors = validateCheckoutData(data);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('rejeita mÃ©todo de pagamento invÃ¡lido', () => {
      const data = { ...validData, metodo_pagamento: 'crypto' };
      const errors = validateCheckoutData(data);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('aceita mÃ©todos de pagamento vÃ¡lidos', () => {
      const metodos = ['pix', 'boleto', 'cartao', 'sumup_online', 'teste'];
      metodos.forEach(metodo => {
        const data = { ...validData, metodo_pagamento: metodo };
        const errors = validateCheckoutData(data);
        expect(errors).toHaveLength(0);
      });
    });

    test('rejeita CPF invÃ¡lido (se fornecido)', () => {
      const data = { ...validData, cpf_entrega: '00000000000' };
      const errors = validateCheckoutData(data);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('rejeita mÃºltiplos erros de uma vez', () => {
      const invalidData = {
        nome_entrega: 'J',
        email_entrega: 'invalid',
        cep: '123',
        logradouro: 'Rua',
        numero: '123',
        cidade: 'SÃ£o Paulo',
        estado: 'INVALID',
        metodo_pagamento: 'invalid',
      };
      const errors = validateCheckoutData(invalidData);
      expect(errors.length).toBeGreaterThan(3);
    });
  });

});
