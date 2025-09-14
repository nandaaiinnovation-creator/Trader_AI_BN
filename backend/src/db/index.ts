import { createConnection, ConnectionOptions } from 'typeorm';
import path from 'path';

export async function createAppConnection() {
  const opts: ConnectionOptions = {
    type: 'postgres',
    url: process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, 'entities', '*.js'), path.join(__dirname, 'entities', '*.ts')],
  } as ConnectionOptions;
  return createConnection(opts as any);
}

export default createAppConnection;
