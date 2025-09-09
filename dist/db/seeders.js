"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const entities_1 = require("./entities");
const fs_1 = __importDefault(require("fs"));
async function seed() {
    const connection = await (0, typeorm_1.createConnection)();
    const repo = connection.getRepository(entities_1.Settings);
    const cnt = await repo.count();
    if (cnt === 0) {
        const ruleConfig = JSON.parse(fs_1.default.readFileSync('src/db/seeders/default_rules.json', 'utf8'));
        await repo.save({ encrypted_secrets: {}, rule_config: ruleConfig });
        console.log('Seeded default settings');
    }
    else {
        console.log('Settings already seeded');
    }
    await connection.close();
}
seed();
