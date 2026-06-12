import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

async function main(): Promise<void> {
  const app = await buildApp();
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
