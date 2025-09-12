---
project_name: banknifty-signals
---

# RULES.md

## Overview
This file contains all **trading rules ** used in the **banknifty-signals** .  
Each rule has:
- **Title**
- **Logic/Description**
- **Tunables**
- **Tests**

Rules are **modular, configurable, and persisted** in DB.  
Indicators from `utils/indicators.ts` and Sentiment filters are integrated.

---

> Defaults: see `config/defaults.json` for example tunable values and safe starting defaults.


## 1. Rule Categories
- **Trend / Structure**
- **Momentum**
- **Volume / Internals**
- **Options / OI**
- **Risk / Volatility**
- **Pattern / Price Action**
- **Sentiment**
- **Execution / Guardrails**

---

## Rulebook (split into smaller docs)

To make the rulebook easier to navigate and maintain we split the full list into multiple files under `docs/rules/`.

- Part 1 (rules 1–12): `docs/rules/part-1.md`
- Part 2 (rules 13–24): `docs/rules/part-2.md`
- Part 3 (rules 25–36): `docs/rules/part-3.md`
- Part 4 (rules 37–47 + Utils): `docs/rules/part-4.md`

Global note: All rules must produce intraday signals for BANKNIFTY at 3-minute, 5-minute and 15-minute rolled intervals (server collects 1m base -> rollups to 3/5/15). Signals are only valid during trading hours 09:15–15:30 IST & for backtesting purposes.

> If you want, I can open a PR that moves the split files into a `docs/` folder and updates references across the repo.

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

37. volatilityExpansionRule

• Logic: Detect sudden volatility expansion (ATR or BB width jump) that often precedes directional moves and trigger momentum-follow signals.
• Tunables: expansion_threshold_pct, vol_window, min_follow_through_bars.
• Tests: Confirm expansions precede directional moves and test signal timing after expansion.

38. volumeBalanceRule

• Logic: Compare buy vs sell volume balance; emit signals when imbalance sustained and aligns with price action on rollups.
• Tunables: balance_threshold_pct, normalization_window, smoothing.
• Tests: Validate imbalance lead/lag and alignment with price movement.

39. volumeClimaxRule

• Logic: Detect volume climax (extreme volume zscore) often indicating exhaustion or start of thrust; classify as reversal or continuation based on context.
• Tunables: climax_z_threshold, relative_vol_window, post_climax_window.
• Tests: Validate exhaustion vs continuation labeling and subsequent price behavior.

40. volumeProfileRule

• Logic: Use intraday volume profile HVN/LVN to detect rejections or breakouts and trigger signals when price interacts with profile levels.
• Tunables: profile_window_mins, hvn_lvn_threshold, rejection_confirmation_bars.
• Tests: Confirm bounce/rejection at HVN/LVN and measure signal hit rates.

41. vwapBiasRule

• Logic: Use session VWAP and bands; emit BUY when price sustained above VWAP band and SELL when below, with rollup confirmations.
• Tunables: vwap_band_sigma, sustain_bars_required, vwap_timeout_minutes.
• Tests: Check bounce/rejection stats at VWAP and that sustaining above/below band increases confidence.

42. wickRejectionRule

• Logic: Detect strong wick rejection from key level (long tail with close away) and emit contrarian intraday signals when supported by volume.
• Tunables: wick_to_body_ratio, key_level_filter, min_volume_z.
• Tests: Validate rejection leads to reversal for a high % and ensure rule suppressed in low-volume contexts.

Meta Rules (Regime / Composite Layer)
43. regimeDetectionRule

• Logic: Classify market regime (Trending / Range / Mean-Revert) using volatility, H/L overlap, ADX, BB bandwidth and recent breakout success rate; smooth transitions.
• Tunables: regime_window, feature_set, transition_smoothing, min_confidence.
• Tests: Verify regime labels match visual regimes and that transition smoothing prevents flip-flop.

44. regimeAwareWeightingRule

• Logic: Adjust per-rule weights according to detected regime (e.g., up-weight trend rules in Trending regime).
• Tunables: weights[regime][rule] (editable), weight_decay_rate.
• Tests: Confirm weighting changes alter composite outputs as intended and improves historical regime-specific performance.

45. compositeScoreRule

• Logic: Compute weighted sum of enabled rule outputs → composite score; apply cooldown (bars or ATR retrace) before allowing retrigger.
• Tunables: signal_threshold, cooldown_bars, cooldown_retrace_atr, min_rules_agree.
• Tests: Ensure composite crosses threshold only when enough weighted support exists and cooldown prevents rapid reentries.

46. conflictResolutionRule

• Logic: When opposing signals appear within conflict window, net by composite score or default to neutral if within min_diff; apply hysteresis to avoid flip-flops.
• Tunables: conflict_window_bars, min_diff, hysteresis_bars.
• Tests: Simulate conflicting bursts and ensure resolution keeps higher conviction or returns neutral per configuration.

47. duplicateSuppressionRule

• Logic: Suppress repeated identical signals within a retrigger window unless composite rises by retrigger_delta to avoid redundant entries on same side.
• Tunables: retrigger_window_bars, min_delta_retrigger, allow_partial_retrigger.
• Tests: Verify duplicates suppressed and legitimate stronger re-signals allowed after min_delta_retrigger.

Utils & Defaults (reminder)
• Implement core indicators in /utils/indicators.js: SMA, EMA, RSI, ATR, VWAP, MACD, Bollinger, Stoch, OBV, bandwidth, ADX.
• /config/defaults.json must contain safe out-of-box defaults for every tunable above so app works immediately.