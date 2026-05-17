// Force IPv4 DNS resolution BEFORE any other requires
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

module.exports = pool;