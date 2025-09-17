import { createConnection, ConnectionOptions } from 'typeorm';
import path from 'path';

function buildPostgresUrlFromEnv(): string | undefined {
  // Prefer POSTGRES_URL if provided; otherwise assemble from discrete vars.
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (url) return url;
  const host = process.env.POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT;
  const db = process.env.POSTGRES_DB;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  if (host && port && db && user && password) {
    return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
  }
  return undefined;
}

export async function createAppConnection() {
  const opts: ConnectionOptions = {
    type: 'postgres',
    url: buildPostgresUrlFromEnv() || 'postgres://postgres:postgres@localhost:5432/postgres',
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, 'entities', '*.js'), path.join(__dirname, 'entities', '*.ts')],
  } as ConnectionOptions;
  return createConnection(opts as any);
}

export default createAppConnection;
