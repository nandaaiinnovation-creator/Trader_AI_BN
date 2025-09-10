"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
exports.logger = (0, pino_1.default)({
    level: 'info',
    transport: { target: 'pino-pretty' },
    redact: ['encrypted_secrets', 'api_key', 'api_secret', 'access_token']
});
