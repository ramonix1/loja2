import type { FastifyInstance } from 'fastify';

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/public/payment-config', async (_request, reply) => {
    return reply.send({
      data: {
        stripe_public_key: process.env.STRIPE_PUBLIC_KEY ?? '',
        sumup_enabled: process.env.SUMUP_API_KEY ? true : false,
      },
    });
  });
}
