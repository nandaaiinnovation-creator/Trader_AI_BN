import { WebSocket } from 'ws';
import axios from 'axios';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/helpers';
import { Settings } from '../db/entities';
import { decrypt, encrypt } from '../utils/crypto';
import { EventEmitter } from 'events';
import { KiteTick } from '../types/zerodha';

interface KiteCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
}

export class ZerodhaService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscribedTokens: Set<number> = new Set();
  private credentials: KiteCredentials | null = null;

  // BankNifty Components with weights
  private readonly components = {
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

  // Allow overriding the Kite WS URL via env for testing/mocks
  private static readonly DEFAULT_WS_URL = process.env.ZERODHA_WS_URL || 'wss://ws.kite.trade/v3';

  // Control whether the service should open a real WebSocket connection.
  // Defaults to disabled in test/CI to avoid opening live connections.
  private static readonly ENABLE_WS = (process.env.ZERODHA_ENABLE_WS === 'true') || (process.env.NODE_ENV !== 'test');

  constructor() {
    super();
    // Don't auto-load credentials during Jest tests to avoid requiring DB/data source initialization
    if (process.env.NODE_ENV !== 'test') {
      this.loadCredentials();
    }
  }

  private async loadCredentials() {
    try {
      const settings = await Settings.findOne({ where: { id: 1 } });
      if (!settings || !((settings.encrypted_secrets as any)?.zerodha)) {
        logger.warn('No Zerodha credentials found in settings');
        return;
      }
      const decrypted = decrypt((settings.encrypted_secrets as any).zerodha);
      this.credentials = JSON.parse(decrypted);
    } catch (err) {
  logger.error({ message: 'Failed to load Zerodha credentials', err });
    }
  }

  public getLoginUrl(): string {
    if (!this.credentials?.apiKey) {
      throw new Error('Zerodha API key not configured');
    }
    return `https://kite.zerodha.com/connect/login?api_key=${this.credentials.apiKey}&v=3`;
  }

  public async handleCallback(requestToken: string): Promise<void> {
    if (!this.credentials?.apiKey || !this.credentials?.apiSecret) {
      throw new Error('Zerodha credentials not configured');
    }

    try {
      const response = await axios.post('https://api.kite.trade/session/token', {
        api_key: this.credentials.apiKey,
        request_token: requestToken,
        checksum: this.generateChecksum(requestToken)
      });

      this.credentials.accessToken = response.data.data.access_token;
      await this.saveCredentials();
      // Only connect automatically if WS is enabled
      if (ZerodhaService.ENABLE_WS) {
        await this.connect();
      } else {
        logger.info('Zerodha WebSocket auto-connect disabled by environment; skipping connect after callback');
      }
    } catch (err) {
  logger.error({ message: 'Failed to exchange request token', err });
      throw new Error('Failed to authenticate with Zerodha');
    }
  }

  private async connect(url?: string) {
    if (!this.credentials?.accessToken) {
      throw new Error('No access token available');
    }

    // If a URL isn't provided, only attempt connect when WS is enabled.
    if (!url && !ZerodhaService.ENABLE_WS) {
      logger.info('Zerodha WebSocket disabled by environment; connect() skipped');
      return;
    }
    try {
      const wsUrl = url || process.env.ZERODHA_WS_URL || ZerodhaService.DEFAULT_WS_URL;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        logger.info('Connected to Zerodha WebSocket');
        this.resetReconnectAttempts();
        this.startHeartbeat();
        this.subscribe();
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleTick(data);
      });

      this.ws.on('close', () => {
        logger.warn('Zerodha WebSocket closed');
        this.scheduleReconnect();
      });

      this.ws.on('error', (err) => {
  logger.error({ message: 'Zerodha WebSocket error', err });
        this.ws?.close();
      });

    } catch (err) {
    logger.error({ message: 'Failed to connect to Zerodha WebSocket', err });
      this.scheduleReconnect();
    }
  }

  // Public helper used by tests or external flows to trigger a connection
  public async connectTo(url?: string) {
    return this.connect(url);
  }

  // Public setter to allow tests to inject credentials without DB access
  public setCredentials(creds: KiteCredentials) {
    this.credentials = creds;
  }

  private handleTick(data: Buffer) {
    try {
      // Reset heartbeat timer on any message
      this.resetHeartbeat();

      const packet = this.parseBinaryTick(data);
      if (!packet) return;

      // Store in Redis and emit
      this.storeTick(packet);
      this.emit('tick', packet);

    } catch (err) {
    logger.error({ message: 'Failed to handle tick', err });
    }
  }

  private parseBinaryTick(data: Buffer): KiteTick | null {
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
        } else if (mode === 'quote' || mode === 'full') {
          const tick: KiteTick = {
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
    } catch (err) {
    logger.error({ message: 'Failed to parse binary tick', err });
    }
    return null;
  }

  private async storeTick(tick: any) {
    const key = `ticks:${tick.symbol}`;
    try {
      // Guard Redis usage for tests or when client isn't connected
      // @redis/client exposes `isOpen` to detect connection state
      // If Redis is not available, skip caching silently
      // (rules engine still receives ticks via event emit)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (redisClient && (redisClient as any).isOpen) {
        await redisClient.set(key, JSON.stringify(tick));
        await redisClient.expire(key, 300); // 5 minute TTL
      } else {
        logger.debug('Redis client not open; skipping tick cache');
      }
    } catch (err) {
      logger.warn({ message: 'Failed to store tick in Redis; skipping', err });
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (Date.now() - this.lastMessageTime > 30000) {
        logger.warn('No heartbeat for 30s, reconnecting...');
        this.ws?.close();
      }
    }, 30000);
  }

  private resetHeartbeat() {
    this.lastMessageTime = Date.now();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }

  private async saveCredentials() {
    try {
      await (Settings as any).update({ id: 1 }, ({
        encrypted_secrets: {
          zerodha: encrypt(JSON.stringify(this.credentials))
        }
      } as any));
    } catch (err) {
    logger.error({ message: 'Failed to save Zerodha credentials', err });
    }
  }

  public async fetchHistoricalData(symbol: string, from: Date, to: Date, interval: string) {
    if (!this.credentials?.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get(`https://api.kite.trade/instruments/historical/${symbol}/${interval}`, {
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
    } catch (err) {
    logger.error({ message: 'Failed to fetch historical data', err });
      throw err;
    }
  }

  public async fetchQuote(symbol: string) {
    if (!this.credentials?.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get(`https://api.kite.trade/quote`, {
        headers: {
          'X-Kite-Version': '3',
          Authorization: `token ${this.credentials.apiKey}:${this.credentials.accessToken}`
        },
        params: {
          i: symbol
        }
      });

      return response.data.data[symbol];
    } catch (err) {
    logger.error({ message: 'Failed to fetch quote', err });
      throw err;
    }
  }

  private subscribe() {
    // Subscribe to BANKNIFTY and its components
    const tokens = [
      260105, // BANKNIFTY
      ...Object.keys(this.components).map(symbol => this.getInstrumentToken(symbol))
    ];

    this.subscribedTokens = new Set(tokens);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        a: 'subscribe',
        v: Array.from(this.subscribedTokens)
      }));
    }
  }

  private getInstrumentToken(symbol: string): number {
    // Implement instrument token lookup
    // You'd typically maintain a mapping or fetch from Zerodha's instruments API
    return 0; // placeholder
  }

  private lastMessageTime: number = Date.now();
  private tokenToSymbolMap: Map<number, string> = new Map();
  
  public getWsState(): string {
    return this.ws?.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED';
  }

  public getLastMessageTime(): number {
    return this.lastMessageTime;
  }

  private getSymbolFromToken(token: number): string {
    return this.tokenToSymbolMap.get(token) || 'UNKNOWN';
  }

  private async loadInstruments() {
    if (!this.credentials?.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get('https://api.kite.trade/instruments', {
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
    } catch (err) {
    logger.error({ message: 'Failed to load instruments', err });
    }
  }

  private generateChecksum(requestToken: string): string {
    // Implement checksum generation as per Zerodha docs
    return '';
  }

  public cleanup() {
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

export const zerodhaService = new ZerodhaService();
