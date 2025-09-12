# Rules — Part 3 (25–36)

25. preMarketMomentumRule

• Logic: Capture pre-market futures/early session momentum and bias first-hour intraday signals consistent with that pre-open trend.
• Tunables: premarket_window_minutes, min_premarket_move_pct, apply_for_bars.
• Tests: Validate premarket move predictive power for open + early intraday signals.

26. roundNumberMagnetRule

• Logic: Treat round strike/price levels as magnet/support-resistance; generate bounce or breakout signals when price approaches and reacts within tolerance.
• Tunables: round_interval, tolerance_pct, reaction_window_bars.
• Tests: Measure bounce vs break frequency at levels and validate event triggers.

27. rsiAdaptiveRule

• Logic: Adjust RSI overbought/oversold thresholds dynamically based on volatility regime (ATR); emit signals when adaptive thresholds crossed.
• Tunables: rsi_len, base_upper, base_lower, volatility_adjustment_factor.
• Tests: Check threshold shifting by ATR and verify stable signal count across regimes.

28. sectorRotationRule

• Logic: Use relative strength of Bank sector vs broader market or constituents to bias or suppress intraday signals.
• Tunables: sector_window, rotation_threshold, weighting_mode.
• Tests: Validate detection of sector rotation and that biases improve directional accuracy.

29. spreadGuardRule

• Logic: Detect wide bid-ask spreads and down-weight or block signals to avoid poor execution.
• Tunables: max_spread_ticks, min_liquidity_volume, action (block|downweight).
• Tests: Simulate wide spread scenarios and ensure signals are blocked or lowered in confidence.

30. stochasticRule

• Logic: Use Stochastic %K/%D crossings in context of trend to issue intraday entries at 3/5/15m when confluence present.
• Tunables: k_len, d_len, overbought, oversold, trend_filter.
• Tests: Validate cross triggers in trend vs range and false positive suppression.

31. supertrendRule

• Logic: Use SuperTrend flips (ATR-based) for directional bias and first-pullback entries on flip; issue signals at rollups.
• Tunables: atr_len, multiplier, pullback_depth_atr.
• Tests: Confirm flip detection and test pullback entries after flip.

32. swingBreakRule

• Logic: Detect clean break of recent swing high/low with confirmation volume and momentum for intraday rollout signals.
• Tunables: swing_window, min_confirm_volume_z, momentum_confirm_len.
• Tests: Validate swing-break success rate and avoid fake-break filter.

33. threeBarThrustRule

• Logic: Detect 3-bar thrust (consecutive strong closes with increasing range) and follow on momentum for intraday trades.
• Tunables: bars=3, min_range_growth_pct, vol_filter_z.
• Tests: Confirm pattern detection and test continuation vs exhaustion.

34. timePatternRule

• Logic: Identify repeating intraday time-of-day patterns (e.g., end-of-hour liquidity moves) and bias signals when pattern matched.
• Tunables: session_window, pattern_library, match_confidence.
• Tests: Verify repeatability across multiple sessions and correct detection of pattern-triggered signal bias.

35. trendHTFRule

• Logic: Use higher timeframe trend (5/15/60m) to bias 3/5/15m signals — require HTF confluence for higher conviction.
• Tunables: htf_windows, confluence_required_count, htf_weight.
• Tests: Multi-timeframe confluence tests and suppression when HTF disagrees.

36. trendlineBreakRule

• Logic: Auto-fit trendlines to pivots; signal on confirmed breakout with min touchpoints and volume confirmation at 3/5/15m.
• Tunables: min_touch_points, break_buffer_pct, min_break_volume_z.
• Tests: Differentiate valid trendline breaks vs false ones and confirm volume requirement prevents fakes.
