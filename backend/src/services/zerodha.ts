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
  // Maximum number of backoff attempts before giving up (can be overridden in tests)
  private maxReconnectAttempts = 12;
  // Reconnect tuning parameters (configurable for tests)
  private reconnectBaseMs = 1000;
  private reconnectMaxDelayMs = 30000;
  private jitterFn: () => number = () => Math.floor(Math.random() * 1000);
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private subscribedTokens: Set<number> = new Set();
  // Rate-limit tracking for subscribe sends
  private recentSubscribeTimestamps: number[] = [];
  private subscribeWindowMs = 1000; // window to count subscribe attempts
  private maxSubscribePerWindow = 5; // default allowed per window
  private subscribeBackoffMs = 5000; // backoff when rate limit exceeded
  private suspendSubscribesUntil?: number;
  private credentials: KiteCredentials | null = null;
  private tokenExpiresAt?: number;
  // Test hooks: how long before expiry to emit refresh events
  private tokenRefreshBeforeMs: number = 60 * 1000;
  // Optional pluggable token refresh handler provided by higher-level code.
  // Should be an async function that returns a new access token string.
  private refreshHandler: (() => Promise<string | undefined>) | null = null;

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
  // By default, auto-resubscribe after reconnect is enabled. Tests can disable it.
  private autoResubscribe = true;

  // Allow tests or callers to enable/disable automatic resubscribe after reconnect
  public setAutoResubscribe(enabled: boolean) {
    this.autoResubscribe = !!enabled;
  }

  // Inspect current auto-resubscribe setting (testable)
  public getAutoResubscribe(): boolean {
    return !!this.autoResubscribe;
  }
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

      // Attach core handlers immediately so we never miss events that may
      // occur very soon after connection (important for deterministic tests)
      this.ws.on('message', (data: Buffer) => {
        this.handleTick(data);
      });

      this.ws.on('close', () => {
        logger.warn('Zerodha WebSocket closed');
        // Count this as a reconnect-triggering close so tests can observe
        try { this.reconnectAttempts++; } catch (e) {}
        this.scheduleReconnect();
      });

      // Also attach to the underlying TCP socket close event when available.
      // Some environments (and fake timers) may cause the high-level 'close'
      // event to be delayed; listening to `_socket` adds robustness in tests.
      const attachSocketClose = () => {
        try {
          const sock = (this.ws as any)?._socket;
          if (sock && !sock._zerodhaCloseAttached) {
            sock._zerodhaCloseAttached = true;
            sock.on('close', () => {
              logger.debug('Underlying socket closed');
              try { this.reconnectAttempts++; } catch (e) {}
              this.scheduleReconnect();
            });
          }
        } catch (e) {}
      };

      attachSocketClose();
      this.ws.on('open', attachSocketClose);

      // If caller provided a URL (tests/mocks), return a promise that resolves
      // when the socket 'open' event fires, making connect deterministic for tests.
      const openPromise = new Promise<void>((resolve, reject) => {
        this.ws?.on('open', () => {
          logger.info('Connected to Zerodha WebSocket');
          this.resetReconnectAttempts();
          this.startHeartbeat();
          if (this.autoResubscribe) this.subscribe();
          resolve();
        });

        this.ws?.on('error', (err) => {
          logger.error({ message: 'Zerodha WebSocket error', err });
          try { this.ws?.close(); } catch (e) {}
          reject(err);
        });
      });

      return openPromise;

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
    // Avoid noisy error logs during tests; allow opt-in silence via env
    if (process.env.NODE_ENV === 'test' || process.env.ZERODHA_SILENCE_PARSE === 'true') {
      try { logger.debug({ message: 'Failed to handle tick (suppressed in test)', err }); } catch (e) {}
    } else {
      logger.error({ message: 'Failed to handle tick', err });
    }
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
    // During tests small/incomplete buffers are intentionally fed to the parser
    // and can produce RangeError diagnostics. Avoid noisy error-level logs in
    // test runs; record at debug level instead or allow explicit opt-in via
    // ZERODHA_SILENCE_PARSE env var.
    if (process.env.NODE_ENV === 'test' || process.env.ZERODHA_SILENCE_PARSE === 'true') {
      try { logger.debug({ message: 'Failed to parse binary tick (suppressed in test)', err }); } catch (e) {}
    } else {
      logger.error({ message: 'Failed to parse binary tick', err });
    }
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
    // Do not schedule if we've exceeded max attempts
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached; will not retry until manual intervention');
      return;
    }

    // Backoff with configurable base and jitter
    const base = Math.min(this.reconnectBaseMs * Math.pow(2, this.reconnectAttempts), this.reconnectMaxDelayMs);
    const jitter = Math.max(0, Math.floor(this.jitterFn()));
    const delay = Math.min(base + jitter, this.reconnectMaxDelayMs);

    // Count this as a scheduled attempt immediately so tests can observe it
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      // Connect returns a promise; handle rejections explicitly to avoid
      // unhandled promise rejections in environments where connect() may
      // throw (e.g., missing access token during unit tests).
      this.connect().catch((e) => {
        logger.warn({ message: 'Reconnect attempt failed', err: e });
        try { this.scheduleReconnect(); } catch (er) {}
      });
    }, delay);

    // If available (Node timers), unref so timers don't keep the process alive
    try { (this.reconnectTimer as any)?.unref?.(); } catch (e) {}
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
      // If we saved credentials that include expiry information, schedule refresh
      if (this.credentials && this.tokenExpiresAt) {
        this.scheduleTokenRefresh();
      }
    } catch (err) {
    logger.error({ message: 'Failed to save Zerodha credentials', err });
    }
  }

  private scheduleTokenRefresh() {
    // Clear any existing timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    if (!this.tokenExpiresAt) return;

    const msUntilExpiry = this.tokenExpiresAt - Date.now();
    // Schedule a refresh 60s before expiry (or immediate if already expired)
  const refreshBefore = this.tokenRefreshBeforeMs;
    const timeout = Math.max(0, msUntilExpiry - refreshBefore);

    this.tokenRefreshTimer = setTimeout(() => {
      // Emit an event so higher-level code may attempt re-authentication
      this.emit('token:about-to-expire');
      // Attempt internal refresh (best-effort) — implementations may override
      this.refreshAccessToken().catch((err) => {
        logger.warn({ message: 'Token refresh failed', err });
        this.emit('token:refresh-failed', err);
      });
    }, timeout);
  }

  // Test-friendly helper: set token expiry relative to now (msFromNow)
  // and optionally schedule the refresh timer immediately.
  public setTokenExpiresAt(msFromNow: number, scheduleNow = true) {
    this.tokenExpiresAt = Date.now() + msFromNow;
    if (scheduleNow) {
      this.scheduleTokenRefresh();
    }
  }

  // Test-friendly setter to override how long before expiry we emit the
  // 'token:about-to-expire' event. Default is 60s.
  public setRefreshBeforeMs(ms: number) {
    this.tokenRefreshBeforeMs = Math.max(0, ms);
  }

  // Test-friendly trigger that forces the token refresh flow synchronously.
  // Useful when tests do not want to rely on timers.
  public async triggerTokenRefresh(): Promise<void> {
    // Clear any existing timer to avoid double firing
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    // Emit about-to-expire and call refresh handler
    this.emit('token:about-to-expire');
    try {
      await this.refreshAccessToken();
    } catch (err) {
      logger.warn({ message: 'triggerTokenRefresh: refresh failed', err });
      this.emit('token:refresh-failed', err);
    }
  }

  private async refreshAccessToken(): Promise<void> {
    logger.info('Attempting token refresh');
    // First offer a chance to an injected refresh handler.
    if (this.refreshHandler) {
      try {
        const newToken = await this.refreshHandler();
        if (newToken) {
          // Ensure we have a non-null credentials object before assigning
          const creds: KiteCredentials = this.credentials ?? (this.credentials = { apiKey: '', apiSecret: '' } as KiteCredentials);
          creds.accessToken = newToken;
          this.emit('token:refreshed', newToken);
          return;
        }
      } catch (err) {
        logger.warn({ message: 'refreshHandler failed', err });
      }
    }

    // Fallback: emit events for external workflows to handle.
    this.emit('token:refresh-required');
  }

  // Allow external code to register an async refresh handler
  public setRefreshHandler(handler: (() => Promise<string | undefined>) | null) {
    this.refreshHandler = handler;
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
      // Respect rate limiting when sending subscribe frames
      if (this.isSubscribeSuspended()) {
        // schedule a delayed attempt after suspension
        const wait = (this.suspendSubscribesUntil || Date.now()) - Date.now();
        setTimeout(() => { try { this.subscribe(); } catch (e) {} }, Math.max(0, wait));
        return;
      }
      this.ws.send(JSON.stringify({
        a: 'subscribe',
        v: Array.from(this.subscribedTokens)
      }));
      // record this send for rate-limit tracking
      this.recordSubscribeAttempt();
    }
  }

  // Test helpers and subscription management
  public addSubscribedToken(token: number) {
    this.subscribedTokens.add(token);
  }

  public removeSubscribedToken(token: number) {
    this.subscribedTokens.delete(token);
  }

  public clearSubscribedTokens() {
    this.subscribedTokens.clear();
  }

  // Record a subscribe attempt timestamp; used internally and by tests to simulate bursts
  public recordSubscribeAttempt() {
    const now = Date.now();
    this.recentSubscribeTimestamps.push(now);
    // prune old timestamps outside the window
    const cutoff = now - this.subscribeWindowMs;
    this.recentSubscribeTimestamps = this.recentSubscribeTimestamps.filter(t => t >= cutoff);
    if (this.recentSubscribeTimestamps.length > this.maxSubscribePerWindow) {
      // enter backoff
      this.suspendSubscribesUntil = Date.now() + this.subscribeBackoffMs;
      try {
        logger.warn({ message: 'Subscribe rate limit exceeded; suspending subscriptions', backoffMs: this.subscribeBackoffMs });
      } catch (e) {
        // fallback to string message
        try { logger.warn(`Subscribe rate limit exceeded; suspending subscriptions for ${this.subscribeBackoffMs} ms`); } catch (er) {}
      }
    }
  }

  // Returns whether subscribe sending is currently suspended due to rate-limiting
  public isSubscribeSuspended(): boolean {
    return !!(this.suspendSubscribesUntil && Date.now() < this.suspendSubscribesUntil);
  }

  // Allow tests to configure rate-limit behavior
  public setRateLimitOptions(options: { windowMs?: number; maxPerWindow?: number; backoffMs?: number }) {
    if (typeof options.windowMs === 'number') this.subscribeWindowMs = Math.max(1, options.windowMs);
    if (typeof options.maxPerWindow === 'number') this.maxSubscribePerWindow = Math.max(1, options.maxPerWindow);
    if (typeof options.backoffMs === 'number') this.subscribeBackoffMs = Math.max(0, options.backoffMs);
  }

  // Test helper to set subscribed tokens without sending over the wire.
  // Useful in tests that don't open real sockets.
  public setSubscribedTokens(tokens: number[]) {
    this.subscribedTokens = new Set(tokens || []);
  }

  // Test helper to inspect the currently subscribed tokens.
  public getSubscribedTokens(): number[] {
    return Array.from(this.subscribedTokens);
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

  // Test-friendly helper: trigger scheduling of a reconnect (wraps private logic)
  // Keeps production behavior unchanged but provides a deterministic entrypoint
  // for unit tests without needing to close sockets.
  public triggerReconnect(): void {
    try {
      this.scheduleReconnect();
    } catch (e) {
      // swallow in tests
    }
  }

  // Expose reconnectAttempts for tests/metrics
  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // Allow tests or callers to tune reconnect behavior for determinism
  public setReconnectOptions(options: { baseMs?: number; maxDelayMs?: number; jitterFn?: () => number; maxAttempts?: number }) {
    if (typeof options.baseMs === 'number') this.reconnectBaseMs = Math.max(1, options.baseMs);
    if (typeof options.maxDelayMs === 'number') this.reconnectMaxDelayMs = Math.max(1, options.maxDelayMs);
    if (typeof options.jitterFn === 'function') this.jitterFn = options.jitterFn;
    if (typeof options.maxAttempts === 'number') this.maxReconnectAttempts = Math.max(1, options.maxAttempts);
  }

  // Cancel any scheduled reconnect attempt
  public stopReconnect(): void {
    try {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    } catch (e) {}
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

  // Synchronous convenience cleanup kept for callers that don't need to await close
  public cleanup() {
    void this.cleanupAsync().catch((err) => {
      logger.warn({ message: 'cleanup() encountered error', err });
    });
  }

  // Proper async cleanup that ensures timers are cleared, listeners removed,
  // and the WebSocket is closed and awaited. Tests should call this.
  public async cleanupAsync(): Promise<void> {
    // Clear heartbeat timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear token refresh timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    // Remove subscribed tokens to avoid accidental sends
    this.subscribedTokens.clear();

    // Close websocket and await close event
    if (this.ws) {
      try {
        await new Promise<void>((resolve) => {
          // Remove message listeners to avoid re-entrancy while closing
          try { this.ws?.removeAllListeners('message'); } catch (e) {}
          try { this.ws?.removeAllListeners('open'); } catch (e) {}
          try { this.ws?.removeAllListeners('error'); } catch (e) {}
          try { this.ws?.removeAllListeners('close'); } catch (e) {}

          // If already closed, resolve immediately
          if (this.ws?.readyState !== WebSocket.OPEN && this.ws?.readyState !== WebSocket.CONNECTING) {
            try { this.ws?.terminate(); } catch (e) {}
            this.ws = null;
            return resolve();
          }

          this.ws?.once('close', () => {
            this.ws = null;
            resolve();
          });

          try {
            this.ws?.close();
          } catch (e) {
            try { this.ws?.terminate(); } catch (er) {}
            this.ws = null;
            resolve();
          }
        });
      } catch (err) {
        logger.warn({ message: 'Error while closing Zerodha WebSocket in cleanupAsync', err });
        try { this.ws?.terminate(); } catch (e) {}
        this.ws = null;
      }
    }
  }
}

export const zerodhaService = new ZerodhaService();
