# Rules — Part 1 (1–12)

This file contains rules 1 through 12 extracted from the main RULES.md.

1. adrPdrBreakoutRule

• Logic: Detect breakout above/below Average Daily Range (ADR) or Previous Day Range (PDR); confirm with directionally aligned volume before emitting 3/5/15m signals.
• Tunables: adr_window, pdr_lookback, breakout_threshold_pct, volume_multiplier, false_breakout_filter_seconds.
• Tests: Verify breakout > ADR/PDR triggers, volume confirms vs false-breakout scenario, rule fires correctly at 3/5/15m rollups.

2. atrNormalizationRule

• Logic: Scale/normalize raw price moves by ATR to make threshold decisions volatility-aware; produces normalized momentum contribution for 3/5/15m signals.
• Tunables: atr_length, normalization_mode (percentile|zscore), adaptive_scaling_factor.
• Tests: Validate normalized values stable across low/high ATR days and threshold mapping yields consistent signal rates.

3. bollingerSqueezeRule

• Logic: Detect low BB bandwidth (squeeze) and flag breakout when price closes outside bands with volume confirmation for intraday 3/5/15m signals.
• Tunables: band_length, sigma, squeeze_bandwidth_threshold_pct, breakout_volume_multiplier.
• Tests: Confirm squeeze→breakout chain triggers only after bandwidth threshold and volume confirms direction.

4. breadthProxyRule

• Logic: Use BankNifty constituency advance/decline percent and sector proxies as a breadth confirmation overlay to bias signals at 3/5/15m.
• Tunables: breadth_window, min_pct_agree, divergence_threshold, regime_weighting.
• Tests: Validate that when breadth > threshold, signals align with index; detect and flag divergence cases.

5. breakRetestRule

• Logic: After level breakout, wait for a retest within N bars; if retest rejects and volume supports, emit a follow-up 3/5/15m signal.
• Tunables: retest_tolerance_pct, retest_bars, reentry_max_delay_seconds.
• Tests: Simulate breakout then successful retest vs failed retest; confirm only successful retests trigger re-entry.

6. cvdImbalanceRule

• Logic: Detect cumulative volume delta (CVD) imbalance favoring buy or sell side and use as confirming filter for intraday signals.
• Tunables: cvd_lookback, imbalance_z_threshold, smoothing_window.
• Tests: Validate CVD leads/lags price moves, fire when CVD zscore > threshold and align with price direction.

7. dynamicSRRule

• Logic: Build dynamic support/resistance from recent swing pivots + liquidity clusters; treat break/rejection at these zones as signal events.
• Tunables: pivot_window, cluster_sensitivity, min_cluster_volume, level_tolerance_pct.
• Tests: Ensure levels detect real pivot zones, test break vs rejection outcomes and alignment with volume clusters.

8. engulfingVolumeRule

• Logic: Bullish/bearish engulfing candle validated by above-average volume z-score to trigger intraday signals on rollups.
• Tunables: min_volume_ratio, body_to_wick_ratio, volume_z_len.
• Tests: Compare pattern with/without volume filter; confirm only volume-confirmed engulfing produces signals.

9. gapAnalysisRule

• Logic: Classify overnight/opening gaps (continuation, exhaustion, fade) and apply rules to decide to follow or fade on morning 3/5/15m windows.
• Tunables: gap_size_pct, min_open_drive_pct, fade_max_fill_pct, volume_confirmation.
• Tests: Validate gap classification accuracy and that only matching continuation/exhaustion workflows trigger signals.

10. hhhlLLlhRule

• Logic: Detect structural patterns of HH/HL (bullish) or LL/LH (bearish) over recent pivots; bias intraday signals to structure direction.
• Tunables: swing_window, min_pivot_distance_atr, min_legs.
• Tests: Run sequences with synthetic pivots to confirm pattern detection and test suppression during choppy price action.

11. insideBarRule

• Logic: Detect inside bar(s) (single or multi) and trigger breakout signal when price breaks high/low with minimum body size and volume confirmation.
• Tunables: ib_lookback_bars, min_body_fraction, volume_confirmation_z.
• Tests: Validate inside bar breakout vs false breakout and ensure breakout fires on 3/5/15m aggregated bars.

12. intradayCorrelationRule

• Logic: Monitor short-term correlation between BANKNIFTY and NIFTY/sector components; down-weight or veto signals on strong negative divergence.
• Tunables: correlation_window, correlation_threshold, divergence_hold_bars.
• Tests: Confirm rule identifies correlation drops and that signals are flagged or de-weighted accordingly.
