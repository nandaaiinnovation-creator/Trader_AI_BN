const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const sql = fs.readFileSync('src/db/migrations/001_init.sql', 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/banknifty' });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Migrations applied');
  } finally {
    await client.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
