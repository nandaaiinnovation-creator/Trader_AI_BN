CREATE TABLE IF NOT EXISTS candles (
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    ts timestamptz NOT NULL,
    open NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    volume NUMERIC NOT NULL,
    vwap NUMERIC,
    oi NUMERIC,
    PRIMARY KEY(symbol, timeframe, ts)
);

CREATE TABLE IF NOT EXISTS signals (
    id SERIAL PRIMARY KEY,
    ts timestamptz NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT CHECK (side IN ('BUY','SELL')) NOT NULL,
    score NUMERIC NOT NULL,
    regime TEXT NOT NULL,
    rules_fired JSONB NOT NULL,
    reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    encrypted_secrets JSONB NOT NULL,
    rule_config JSONB NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sentiment_daily (
    date date NOT NULL,
    symbol TEXT NOT NULL,
    provider TEXT NOT NULL,
    score NUMERIC NOT NULL,
    articles JSONB NOT NULL,
    PRIMARY KEY(date, symbol, provider)
);

CREATE TABLE IF NOT EXISTS snapshots (
    id SERIAL PRIMARY KEY,
    ts timestamptz NOT NULL,
    symbol TEXT NOT NULL,
    payload JSONB NOT NULL
);
