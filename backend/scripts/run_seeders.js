const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/banknifty' });
  await db.connect();
  try {
    // Simple seeder: insert default settings if not present
    const rules = JSON.parse(fs.readFileSync('src/db/seeders/default_rules.json', 'utf8'));
    const res = await db.query(`SELECT count(*) as cnt FROM settings`);
    if (res.rows.length > 0 && Number(res.rows[0].cnt) === 0) {
      await db.query('INSERT INTO settings(key, value) VALUES($1, $2)', ['defaults', JSON.stringify({ rules })]);
      console.log('Seeded default settings');
    } else {
      console.log('Settings already present, skipping seed');
    }
  } finally {
    await db.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
