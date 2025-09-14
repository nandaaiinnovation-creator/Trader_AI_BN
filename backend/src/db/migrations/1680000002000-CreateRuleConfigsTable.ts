import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRuleConfigsTable1680000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rule_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        enabled BOOLEAN NOT NULL DEFAULT true,
        config JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS rule_configs;`);
  }
}

export default CreateRuleConfigsTable1680000002000;
