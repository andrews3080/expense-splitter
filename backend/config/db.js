// config/db.js
require('dotenv').config();
const { Pool } = require('pg');

// A Pool manages a set of reusable connections to Postgres —
// instead of opening/closing a connection per request, we borrow
// one from this pool each time we need to run a query
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to Postgres');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;