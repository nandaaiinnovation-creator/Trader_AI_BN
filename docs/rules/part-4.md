# Rules — Part 4 (37–47 + Utils)

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
