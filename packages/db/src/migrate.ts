import { runMigrations } from './client.js';

await runMigrations();
console.log('[@lojao/db] Migrations aplicadas com sucesso.');
