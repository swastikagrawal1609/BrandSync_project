const { Pool } = require('pg');
require('dotenv').config();

// Supabase Connection Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase uses standard SSL, rejectUnauthorized: false is usually safe for development
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('✅ Successfully connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle Supabase client', err);
  process.exit(-1);
});

module.exports = pool;