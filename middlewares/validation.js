// Middleware de validação e sanitização de inputs

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

  // Validar campos obrigatórios
  if (!body.nome_entrega || String(body.nome_entrega).trim().length < 3) {
    errors.push('Nome de entrega inválido (m�nimo 3 caracteres)');
  }

  if (!validateEmail(body.email_entrega)) {
    errors.push('Email inválido');
  }

  if (!validateCEP(body.cep)) {
    errors.push('CEP inválido');
  }

  if (!body.logradouro || String(body.logradouro).trim().length < 3) {
    errors.push('Logradouro inválido');
  }

  if (!body.numero || String(body.numero).trim().length === 0) {
    errors.push('Número obrigatório');
  }

  if (!body.cidade || String(body.cidade).trim().length < 2) {
    errors.push('Cidade inválida');
  }

  if (!body.estado || !/^[A-Z]{2}$/.test(body.estado)) {
    errors.push('Estado inválido');
  }

  if (!['pix', 'boleto', 'cartao', 'sumup_online', 'teste'].includes(body.metodo_pagamento)) {
    errors.push('Método de pagamento inválido');
  }

  // CPF é opcional, mas se fornecido deve ser válido
  if (body.cpf_entrega && !validateCPF(body.cpf_entrega)) {
    errors.push('CPF inválido');
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
