import pino from 'pino';
export const logger = pino({
  level: 'info',
  transport: { target: 'pino-pretty' },
  redact: ['encrypted_secrets', 'api_key', 'api_secret', 'access_token']
});
