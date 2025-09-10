"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Snapshot = exports.SentimentDaily = exports.Settings = exports.Signal = exports.Candle = void 0;
const typeorm_1 = require("typeorm");
let Candle = class Candle extends typeorm_1.BaseEntity {
};
exports.Candle = Candle;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Candle.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Candle.prototype, "timeframe", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Candle.prototype, "ts", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric'),
    __metadata("design:type", Number)
], Candle.prototype, "open", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric'),
    __metadata("design:type", Number)
], Candle.prototype, "high", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric'),
    __metadata("design:type", Number)
], Candle.prototype, "low", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric'),
    __metadata("design:type", Number)
], Candle.prototype, "close", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric'),
    __metadata("design:type", Number)
], Candle.prototype, "volume", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric', { nullable: true }),
    __metadata("design:type", Number)
], Candle.prototype, "vwap", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric', { nullable: true }),
    __metadata("design:type", Number)
], Candle.prototype, "oi", void 0);
exports.Candle = Candle = __decorate([
    (0, typeorm_1.Entity)('candles')
], Candle);
let Signal = class Signal extends typeorm_1.BaseEntity {
};
exports.Signal = Signal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Signal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamptz'),
    __metadata("design:type", Date)
], Signal.prototype, "ts", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Signal.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Signal.prototype, "side", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric'),
    __metadata("design:type", Number)
], Signal.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Signal.prototype, "regime", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], Signal.prototype, "rules_fired", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Signal.prototype, "reason", void 0);
exports.Signal = Signal = __decorate([
    (0, typeorm_1.Entity)('signals')
], Signal);
let Settings = class Settings extends typeorm_1.BaseEntity {
};
exports.Settings = Settings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Settings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], Settings.prototype, "encrypted_secrets", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], Settings.prototype, "rule_config", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamptz', { default: () => 'now()' }),
    __metadata("design:type", Date)
], Settings.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamptz', { default: () => 'now()' }),
    __metadata("design:type", Date)
], Settings.prototype, "updated_at", void 0);
exports.Settings = Settings = __decorate([
    (0, typeorm_1.Entity)('settings')
], Settings);
let SentimentDaily = class SentimentDaily extends typeorm_1.BaseEntity {
};
exports.SentimentDaily = SentimentDaily;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'date' }),
    __metadata("design:type", String)
], SentimentDaily.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], SentimentDaily.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], SentimentDaily.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric'),
    __metadata("design:type", Number)
], SentimentDaily.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], SentimentDaily.prototype, "articles", void 0);
exports.SentimentDaily = SentimentDaily = __decorate([
    (0, typeorm_1.Entity)('sentiment_daily')
], SentimentDaily);
let Snapshot = class Snapshot extends typeorm_1.BaseEntity {
};
exports.Snapshot = Snapshot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Snapshot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('timestamptz'),
    __metadata("design:type", Date)
], Snapshot.prototype, "ts", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Snapshot.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], Snapshot.prototype, "payload", void 0);
exports.Snapshot = Snapshot = __decorate([
    (0, typeorm_1.Entity)('snapshots')
], Snapshot);
