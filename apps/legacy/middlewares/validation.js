// Middleware de validaÃ§Ã£o e sanitizaÃ§Ã£o de inputs

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validateCEP(cep) {
  return /^\d{5}-?\d{3}$/.test(cep);
}

function validateCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') return false;
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
}

function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

function validateCheckoutData(body) {
  const errors = [];

  // Validar campos obrigatÃ³rios
  if (!body.nome_entrega || String(body.nome_entrega).trim().length < 3) {
    errors.push('Nome de entrega invÃ¡lido (mÃnimo 3 caracteres)');
  }

  if (!validateEmail(body.email_entrega)) {
    errors.push('Email invÃ¡lido');
  }

  if (!validateCEP(body.cep)) {
    errors.push('CEP invÃ¡lido');
  }

  if (!body.logradouro || String(body.logradouro).trim().length < 3) {
    errors.push('Logradouro invÃ¡lido');
  }

  if (!body.numero || String(body.numero).trim().length === 0) {
    errors.push('NÃºmero obrigatÃ³rio');
  }

  if (!body.cidade || String(body.cidade).trim().length < 2) {
    errors.push('Cidade invÃ¡lida');
  }

  if (!body.estado || !/^[A-Z]{2}$/.test(body.estado)) {
    errors.push('Estado invÃ¡lido');
  }

  if (!['pix', 'boleto', 'cartao', 'sumup_online', 'teste'].includes(body.metodo_pagamento)) {
    errors.push('MÃ©todo de pagamento invÃ¡lido');
  }

  // CPF Ã© opcional, mas se fornecido deve ser vÃ¡lido
  if (body.cpf_entrega && !validateCPF(body.cpf_entrega)) {
    errors.push('CPF invÃ¡lido');
  }

  return errors;
}

module.exports = {
  validateEmail,
  validateCEP,
  validateCPF,
  sanitizeString,
  validateCheckoutData,
};
