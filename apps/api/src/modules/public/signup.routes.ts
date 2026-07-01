import type { FastifyInstance } from 'fastify';

import {
  checkSlugHandler,
  createSignupHandler,
  listSignupPlansHandler,
  previewSignupHandler,
} from './signup.controller.js';

/**
 * API pública de onboarding self-service (Fase G). Sem tenant, sem sessão
 * lojista — o hook de `/api/v1` isenta `/public/signup` da resolução de tenant.
 */
export async function signupRoutes(app: FastifyInstance): Promise<void> {
  app.get('/public/signup/plans', listSignupPlansHandler);
  app.get('/public/signup/check-slug', checkSlugHandler);
  app.post('/public/signup/preview', previewSignupHandler);
  app.post('/public/signup', createSignupHandler);
}

export type { SignupPlan } from './signup.controller.js';
