// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: {
    rejectUnauthorized: false //Required for Render PostgreSQL to c
  }
});

module.exports = pool;


// ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
// ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
