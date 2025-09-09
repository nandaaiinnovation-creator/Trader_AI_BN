import { createClient } from 'redis';
export const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

export function gracefulShutdown() {
  redisClient.quit();
  // Close DB connection, drain requests, unsubscribe WS
  process.exit(0);
}
