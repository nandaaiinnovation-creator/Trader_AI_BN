import { createConnection } from 'typeorm';
import { Settings } from './entities';
import fs from 'fs';

async function seed() {
  const connection = await createConnection();
  const repo = connection.getRepository(Settings);
  const cnt = await repo.count();
  if (cnt === 0) {
    const ruleConfig = JSON.parse(fs.readFileSync('src/db/seeders/default_rules.json', 'utf8'));
    await repo.save({ encrypted_secrets: {}, rule_config: ruleConfig });
    console.log('Seeded default settings');
  } else {
    console.log('Settings already seeded');
  }
  await connection.close();
}

seed();
