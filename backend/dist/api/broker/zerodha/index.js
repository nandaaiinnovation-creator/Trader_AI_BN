"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zerodha_1 = require("../../../services/zerodha");
const logger_1 = require("../../../utils/logger");
const router = (0, express_1.Router)();
router.get('/login-url', (_req, res) => {
    try {
        const url = zerodha_1.zerodhaService.getLoginUrl();
        res.json({ url });
    }
    catch (err) {
        logger_1.logger.error({ message: 'Failed to generate login URL', err });
        res.status(500).json({ error: 'Failed to generate login URL' });
    }
});
router.get('/callback', async (req, res) => {
    const { request_token } = req.query;
    if (!request_token) {
        return res.status(400).json({ error: 'No request token provided' });
    }
    try {
        await zerodha_1.zerodhaService.handleCallback(request_token);
        res.redirect('/');
    }
    catch (err) {
        logger_1.logger.error({ message: 'Zerodha callback failed', err });
        res.status(500).json({ error: 'Authentication failed' });
    }
});
router.get('/status', (_req, res) => {
    res.json({
        connected: zerodha_1.zerodhaService.getWsState() === 'OPEN',
        lastMessageTime: zerodha_1.zerodhaService.getLastMessageTime()
    });
});
exports.default = router;
