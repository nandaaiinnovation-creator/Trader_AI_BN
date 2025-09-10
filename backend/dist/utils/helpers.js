"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = exports.redisClient = void 0;
const redis_1 = require("redis");
exports.redisClient = (0, redis_1.createClient)({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});
function gracefulShutdown() {
    exports.redisClient.quit();
    // Close DB connection, drain requests, unsubscribe WS
    process.exit(0);
}
exports.gracefulShutdown = gracefulShutdown;
