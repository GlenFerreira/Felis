const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.PG_URL || 'postgres://postgres:CWlGyNopNzk1x9Hk1Uc3zlGd9k4kgd4i1O29aNVYpLjg1S2Rb4enEsNgqViGPY7r@62.171.175.197:5432/postgres',
  ssl: false
});

pool.on('error', (err) => {
  console.error('[ERRO PG] Erro inesperado no cliente do pool:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
