import type { FastifyInstance } from 'fastify';

/** Health check usado por Docker/monitoramento. Sem prefixo `/api/v1`. */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    return { status: 'ok', service: 'lojao-api' };
  });
}
