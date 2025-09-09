"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zerodhaService = exports.ZerodhaService = void 0;
const ws_1 = require("ws");
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const helpers_1 = require("../utils/helpers");
const entities_1 = require("../db/entities");
const crypto_1 = require("../utils/crypto");
const events_1 = require("events");
class ZerodhaService extends events_1.EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.heartbeatTimer = null;
        this.subscribedTokens = new Set();
        this.credentials = null;
        // BankNifty Components with weights
        this.components = {
            'HDFCBANK': 29.09,
            'ICICIBANK': 26.47,
            'SBIN': 8.67,
            'KOTAKBANK': 7.83,
            'AXISBANK': 7.67,
            'INDUSINDBK': 3.49,
            'FEDERALBNK': 3.29,
            'IDFCFIRSTB': 3.01,
            'BANKBARODA': 2.92,
            'AUBANK': 2.76
        };
        this.lastMessageTime = Date.now();
        this.tokenToSymbolMap = new Map();
        this.loadCredentials();
    }
    async loadCredentials() {
        try {
            const settings = await entities_1.Settings.findOne({ where: { id: 1 } });
            if (!(settings?.encrypted_secrets?.zerodha)) {
                logger_1.logger.warn('No Zerodha credentials found in settings');
                return;
            }
            const decrypted = (0, crypto_1.decrypt)(settings.encrypted_secrets.zerodha);
            this.credentials = JSON.parse(decrypted);
        }
        catch (err) {
            logger_1.logger.error({ message: 'Failed to load Zerodha credentials', err });
        }
    }
    getLoginUrl() {
        if (!this.credentials?.apiKey) {
            throw new Error('Zerodha API key not configured');
        }
        return `https://kite.zerodha.com/connect/login?api_key=${this.credentials.apiKey}&v=3`;
    }
    async handleCallback(requestToken) {
        if (!this.credentials?.apiKey || !this.credentials?.apiSecret) {
            throw new Error('Zerodha credentials not configured');
        }
        try {
            const response = await axios_1.default.post('https://api.kite.trade/session/token', {
                api_key: this.credentials.apiKey,
                request_token: requestToken,
                checksum: this.generateChecksum(requestToken)
            });
            this.credentials.accessToken = response.data.data.access_token;
            await this.saveCredentials();
            await this.connect();
        }
        catch (err) {
            logger_1.logger.error({ message: 'Failed to exchange request token', err });
            throw new Error('Failed to authenticate with Zerodha');
        }
    }
    async connect() {
        if (!this.credentials?.accessToken) {
            throw new Error('No access token available');
        }
        try {
            this.ws = new ws_1.WebSocket('wss://ws.kite.trade/v3');
            this.ws.on('open', () => {
                logger_1.logger.info('Connected to Zerodha WebSocket');
                this.resetReconnectAttempts();
                this.startHeartbeat();
                this.subscribe();
            });
            this.ws.on('message', (data) => {
                this.handleTick(data);
            });
            this.ws.on('close', () => {
                logger_1.logger.warn('Zerodha WebSocket closed');
                this.scheduleReconnect();
            });
            this.ws.on('error', (err) => {
                logger_1.logger.error({ message: 'Zerodha WebSocket error', err });
                this.ws?.close();
            });
        }
        catch (err) {
            logger_1.logger.error({ message: 'Failed to connect to Zerodha WebSocket', err });
            this.scheduleReconnect();
        }
    }
    handleTick(data) {
        try {
            // Reset heartbeat timer on any message
            this.resetHeartbeat();
            const packet = this.parseBinaryTick(data);
            if (!packet)
                return;
            // Store in Redis and emit
            this.storeTick(packet);
            this.emit('tick', packet);
        }
        catch (err) {
            logger_1.logger.error({ message: 'Failed to handle tick', err });
        }
    }
    parseBinaryTick(data) {
        try {
            // Packet header (2 bytes)
            const numberOfPackets = data.readUInt16BE(0);
            let index = 2;
            for (let i = 0; i < numberOfPackets; i++) {
                // Instrument token (4 bytes)
                const instrumentToken = data.readUInt32BE(index);
                index += 4;
                // Flags (1 byte)
                const flags = data.readUInt8(index);
                index += 1;
                // Packet length depends on mode
                // Mode: ltp = 8 bytes
                //       quote/full = variable (max 184 bytes)
                const mode = (flags & 0x01) ? ((flags & 0x02) ? 'full' : 'quote') : 'ltp';
                // Parse based on mode
                if (mode === 'ltp') {
                    return {
                        mode,
                        instrumentToken,
                        symbol: this.getSymbolFromToken(instrumentToken),
                        lastPrice: data.readFloatBE(index)
                    };
                }
                else if (mode === 'quote' || mode === 'full') {
                    const tick = {
                        mode,
                        instrumentToken,
                        symbol: this.getSymbolFromToken(instrumentToken),
                        lastPrice: data.readFloatBE(index),
                        lastQuantity: data.readUInt32BE(index + 4),
                        averagePrice: data.readFloatBE(index + 8),
                        volume: data.readUInt32BE(index + 12),
                        buyQuantity: data.readUInt32BE(index + 16),
                        sellQuantity: data.readUInt32BE(index + 20),
                        open: data.readFloatBE(index + 24),
                        high: data.readFloatBE(index + 28),
                        low: data.readFloatBE(index + 32),
                        close: data.readFloatBE(index + 36)
                    };
                    if (mode === 'full') {
                        // Parse OI data if available
                        if (flags & 0x04) {
                            tick.oi = data.readUInt32BE(index + 40);
                            if (flags & 0x08) {
                                tick.oiHigh = data.readUInt32BE(index + 44);
                                tick.oiLow = data.readUInt32BE(index + 48);
                            }
                        }
                        // Parse market depth if available
                        if (flags & 0x10) {
                            tick.depth = {
                                buy: [],
                                sell: []
                            };
                            let depthIndex = index + 52;
                            for (let j = 0; j < 5; j++) {
                                // Buy depth
                                tick.depth.buy.push({
                                    price: data.readFloatBE(depthIndex),
                                    quantity: data.readUInt32BE(depthIndex + 4),
                                    orders: data.readUInt16BE(depthIndex + 8)
                                });
                                depthIndex += 12;
                                // Sell depth
                                tick.depth.sell.push({
                                    price: data.readFloatBE(depthIndex),
                                    quantity: data.readUInt32BE(depthIndex + 4),
                                    orders: data.readUInt16BE(depthIndex + 8)
                                });
                                depthIndex += 12;
                            }
                        }
                    }
                    return tick;
                }
            }
        }
        catch (err) {
            logger_1.logger.error({ message: 'Failed to parse binary tick', err });
        }
        return null;
    }
    async storeTick(tick) {
        const key = `ticks:${tick.symbol}`;
        await helpers_1.redisClient.set(key, JSON.stringify(tick));
        await helpers_1.redisClient.expire(key, 300); // 5 minute TTL
    }
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (Date.now() - this.lastMessageTime > 30000) {
                logger_1.logger.warn('No heartbeat for 30s, reconnecting...');
                this.ws?.close();
            }
        }, 30000);
    }
    resetHeartbeat() {
        this.lastMessageTime = Date.now();
    }
    scheduleReconnect() {
        if (this.reconnectTimer)
            return;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }
    resetReconnectAttempts() {
        this.reconnectAttempts = 0;
    }
    async saveCredentials() {
        try {
            await entities_1.Settings.update({ id: 1 }, {
                encrypted_secrets: {
                    zerodha: (0, crypto_1.encrypt)(JSON.stringify(this.credentials))
                }
            });
        }
        catch (err) {
            logger_1.logger.error({ message: 'Failed to save Zerodha credentials', err });
        }
    }
    async fetchHistoricalData(symbol, from, to, interval) {
        if (!this.credentials?.accessToken) {
            throw new Error('No access token available');
        }
        try {
            const response = await axios_1.default.get(`https://api.kite.trade/instruments/historical/${symbol}/${interval}`, {
                headers: {
                    'X-Kite-Version': '3',
                    Authorization: `token ${this.credentials.apiKey}:${this.credentials.accessToken}`
                },
                params: {
                    from: from.toISOString().split('T')[0],
                    to: to.toISOString().split('T')[0],
                    oi: 1
                }
            });
            return response.data.data.candles;
        }
        catch (err) {
            logger_1.logger.error({ message: 'Failed to fetch historical data', err });
            throw err;
        }
    }
    async fetchQuote(symbol) {
        if (!this.credentials?.accessToken) {
            throw new Error('No access token available');
        }
        try {
            const response = await axios_1.default.get(`https://api.kite.trade/quote`, {
                headers: {
                    'X-Kite-Version': '3',
                    Authorization: `token ${this.credentials.apiKey}:${this.credentials.accessToken}`
                },
                params: {
                    i: symbol
                }
            });
            return response.data.data[symbol];
        }
        catch (err) {
            logger_1.logger.error({ message: 'Failed to fetch quote', err });
            throw err;
        }
    }
    subscribe() {
        // Subscribe to BANKNIFTY and its components
        const tokens = [
            260105,
            ...Object.keys(this.components).map(symbol => this.getInstrumentToken(symbol))
        ];
        this.subscribedTokens = new Set(tokens);
        if (this.ws?.readyState === ws_1.WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                a: 'subscribe',
                v: Array.from(this.subscribedTokens)
            }));
        }
    }
    getInstrumentToken(symbol) {
        // Implement instrument token lookup
        // You'd typically maintain a mapping or fetch from Zerodha's instruments API
        return 0; // placeholder
    }
    getWsState() {
        return this.ws?.readyState === ws_1.WebSocket.OPEN ? 'OPEN' : 'CLOSED';
    }
    getLastMessageTime() {
        return this.lastMessageTime;
    }
    getSymbolFromToken(token) {
        return this.tokenToSymbolMap.get(token) || 'UNKNOWN';
    }
    async loadInstruments() {
        if (!this.credentials?.accessToken) {
            throw new Error('No access token available');
        }
        try {
            const response = await axios_1.default.get('https://api.kite.trade/instruments', {
                headers: {
                    'X-Kite-Version': '3',
                    Authorization: `token ${this.credentials.apiKey}:${this.credentials.accessToken}`
                }
            });
            // Parse CSV response and build token map
            const instruments = response.data.split('\\n').slice(1);
            for (const row of instruments) {
                const [instrumentToken, , symbol] = row.split(',');
                if (instrumentToken && symbol) {
                    this.tokenToSymbolMap.set(parseInt(instrumentToken, 10), symbol);
                }
            }
        }
        catch (err) {
            logger_1.logger.error({ message: 'Failed to load instruments', err });
        }
    }
    generateChecksum(requestToken) {
        // Implement checksum generation as per Zerodha docs
        return '';
    }
    cleanup() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
exports.ZerodhaService = ZerodhaService;
exports.zerodhaService = new ZerodhaService();
