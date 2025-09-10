"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const signals_1 = __importDefault(require("./signals"));
const candles_1 = __importDefault(require("./candles"));
const backtest_1 = __importDefault(require("./backtest"));
const settings_1 = __importDefault(require("./settings"));
const router = (0, express_1.Router)();
router.use('/signals', signals_1.default);
router.use('/candles', candles_1.default);
router.use('/backtest', backtest_1.default);
router.use('/settings', settings_1.default);
exports.default = router;
