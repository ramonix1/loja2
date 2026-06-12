export function validateEmail(email: unknown): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function validateCEP(cep: unknown): boolean {
  return /^\d{5}-?\d{3}$/.test(String(cep ?? ''));
}

export function validateCPF(cpf: unknown): boolean {
  if (!cpf || typeof cpf !== 'string') return false;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  let soma = 0;
  for (let i = 1; i <= 9; i++) soma += parseInt(digits.substring(i - 1, i), 10) * (11 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.substring(9, 10), 10)) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(digits.substring(i - 1, i), 10) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(digits.substring(10, 11), 10);
}

export function sanitizeString(str: unknown, maxLength = 255): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

export interface CheckoutBody {
  nome_entrega?: string;
  email_entrega?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  cidade?: string;
  estado?: string;
  cpf_entrega?: string;
  metodo_pagamento?: string;
}

export function validateCheckoutData(body: CheckoutBody): string[] {
  const errors: string[] = [];

  if (!body.nome_entrega || String(body.nome_entrega).trim().length < 3) {
    errors.push('Nome de entrega inválido (mínimo 3 caracteres)');
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
  if (
    !['pix', 'boleto', 'cartao', 'sumup_online', 'teste'].includes(body.metodo_pagamento ?? '')
  ) {
    errors.push('Método de pagamento inválido');
  }
  if (body.cpf_entrega && !validateCPF(body.cpf_entrega)) {
    errors.push('CPF inválido');
  }

  return errors;
}
