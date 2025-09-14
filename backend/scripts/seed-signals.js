const { Client } = require('pg');

async function seed() {
  const c = new Client({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL });
  await c.connect();
  await c.query(`INSERT INTO signals (symbol, rule, data) VALUES ($1,$2,$3)`, ['TEST', 'seed', JSON.stringify({ seeded: true })]);
  await c.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
