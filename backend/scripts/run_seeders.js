const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function seedSettings(db) {
  const file = path.join('src', 'db', 'seeders', 'default_rules.json');
  if (!fs.existsSync(file)) return;
  const rules = JSON.parse(fs.readFileSync(file, 'utf8'));
  const res = await db.query(`SELECT count(*) as cnt FROM settings`);
  if (res.rows.length > 0 && Number(res.rows[0].cnt) === 0) {
    await db.query('INSERT INTO settings(key, value) VALUES($1, $2)', ['defaults', JSON.stringify({ rules })]);
    console.log('Seeded default settings');
  } else {
    console.log('Settings already present, skipping seed');
  }
}

async function seedRuleConfigs(db) {
  const file = path.join('seeders', 'default_rule_configs.json');
  if (!fs.existsSync(file)) return;
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const row of rows) {
    const keys = Object.keys(row);
    const vals = keys.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO rule_configs (${keys.join(',')}) VALUES (${vals.join(',')}) ON CONFLICT (name) DO UPDATE SET enabled = EXCLUDED.enabled, config = EXCLUDED.config`;
    const params = keys.map(k => row[k]);
    await db.query(sql, params);
    console.log(`Seeded rule config: ${row.name}`);
  }
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/banknifty' });
  await db.connect();
  try {
    await seedSettings(db);
    await seedRuleConfigs(db);
  } finally {
    await db.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
