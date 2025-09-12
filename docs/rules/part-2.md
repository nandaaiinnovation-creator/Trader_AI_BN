# Rules — Part 2 (13–24)

13. ivCrushRule

• Logic: Detect rapid implied volatility (IV) collapse after scheduled events and annotate signals (or reduce option-related signals) for intraday windows.
• Tunables: iv_drop_pct, iv_lookback, event_cooldown_minutes.
• Tests: Simulate IV drop events and confirm annotation, and that option/OI rules are suppressed or adjusted.

14. liquidityGrabRule

• Logic: Identify sharp price spike through liquidity cluster (wick through HVN) followed by quick reversal — classify as liquidity grab and issue contrarian signal if confirmed.
• Tunables: wick_to_body_ratio, liquidity_cluster_sensitivity, max_reversion_bars.
• Tests: Validate detection of liquidity grabs and confirm reversal probability vs random spikes.

15. macdCrossRule

• Logic: Use MACD line / signal cross with histogram momentum & optional volume to issue momentum-confirmed intraday signals on rollups.
• Tunables: fast_len, slow_len, signal_len, min_hist_slope, volume_confirm.
• Tests: Test cross with rising/falling histogram slope and ensure cross in chop is filtered.

16. marketProfileRule

• Logic: Derive POC/VAH/VAL from intraday profile; use value-area acceptance/rejection and POC changes as signal triggers on aggregated bars.
• Tunables: profile_interval_minutes, value_area_pct, poc_sensitivity.
• Tests: Confirm reactions at POC/VAH/VAL and ensure rejections produce expected signal behavior.

17. marketThrustRule

• Logic: Detect high-magnitude thrust moves (price + volume + momentum) and follow-through; emit trade signal when thrust crosses thresholds.
• Tunables: thrust_threshold_pct, volume_multiplier, momentum_roc_len.
• Tests: Validate thrust detection vs exhaustion and follow-through probability.

18. meanReversionRule

• Logic: Identify overextensions from short-term mean and emit contrarian intraday signals when reversion conditions + low regime volatility met.
• Tunables: mean_len, deviation_threshold_pct, volatility_filter_atr.
• Tests: Check reversion hits in range markets and suppressed firing in strong trends.

19. momentumDivergenceRule

• Logic: Detect divergence between momentum indicator (ROC/RSI) and price (new high/low) and use as reversal signal for intraday rollups.
• Tunables: momentum_len, divergence_window, min_divergence_strength.
• Tests: Validate detection of classic divergence and check false positives in sustained trends.

20. momentumThresholdRule

• Logic: Only allow signals when momentum metric exceeds threshold (filters weak momentum in chop) for 3/5/15m signals.
• Tunables: momentum_metric, threshold_value, adaptive_scaling.
• Tests: Ensure signals suppressed below threshold and allowed above, across varied vol days.

21. openingRangeBreakoutRule

• Logic: Use opening range (first N minutes) high/low break as trade trigger if breakout volume and subsequent follow-through confirm on aggregated bars.
• Tunables: range_window_mins, breakout_threshold_pct, min_follow_through_bars.
• Tests: Simulate ORB continuation vs false-breakout and confirm correct signal emission.

22. optionFlowRule

• Logic: Detect unusual option flow (large notional, directional call/put buys) and bias underlying intraday signals when flow correlates with price.
• Tunables: min_notional, time_window_secs, flow_bias_confidence.
• Tests: Validate that large flows precede directional moves and rule annotates/weights signals accordingly.

23. optionGreeksRule

• Logic: Monitor aggregated Greeks exposure (gamma/vega) that indicate sensitivity to underlying moves and adjust option-sensitive signals intraday.
• Tunables: greek_thresholds (gamma, vega), exposure_window.
• Tests: Ensure rule flags high gamma/vega periods and that option-flow signals adapt.

24. orderflowDeltaRule

• Logic: Use net orderflow delta (buy vs sell prints) to bias or confirm signals — emit when delta normalized over lookback exceeds threshold.
• Tunables: delta_threshold, normalization_window, smoothing.
• Tests: Confirm delta leads price moves and that normalized delta above threshold raises confidence.
