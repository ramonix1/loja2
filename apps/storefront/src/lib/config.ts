export const API_URL =
  typeof window !== 'undefined'
    ? ''
    : (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001');

export const TENANT_SLUG =
  process.env.TENANT_SLUG ?? process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'loja';

export const IS_DEV = process.env.NODE_ENV !== 'production';
