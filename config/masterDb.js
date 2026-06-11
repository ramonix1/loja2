const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const masterPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/lojao',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = masterPool;
