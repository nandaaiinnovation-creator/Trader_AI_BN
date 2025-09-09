"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultConfig = {
    rules: {
        // rules mapped to filenames under src/services/rules
        trendHTF: { enabled: true, weight: 1.0, params: { ema_fast: 20, ema_slow: 50, confirm_bars: 2 } },
        swingBreak: { enabled: true, weight: 0.8, params: { lookback_swing: 20, close_buffer_ticks: 2 } },
        hhhlLLlh: { enabled: true, weight: 0.7, params: { pivots_window: 10, min_leg_size_atr: 0.5 } },
        trendlineBreak: { enabled: true, weight: 0.8, params: { pivots_window: 10, break_buffer: 2, min_volume_z: 1.5 } },
        vwapBias: { enabled: true, weight: 0.7, params: { vwap_dev_sigma: 1.0 } },
        rsiAdaptive: { enabled: true, weight: 0.6, params: { rsi_len: 14, upper: 70, lower: 30, cooldown_bars: 5 } },
        volumeClimaxRule: { enabled: true, weight: 0.8, params: { volume_ma_period: 20, climax_mult: 2.0, price_reversal_pct: 0.005 } },
        momentumDivergenceRule: { enabled: true, weight: 0.9, params: { rsi_period: 14, pivot_window: 5, min_div_bars: 3 } },
        meanReversionRule: { enabled: true, weight: 0.7, params: { bb_period: 20, bb_std: 2, min_vol_ratio: 1.2, mean_revert_bars: 5 } },
        volumeProfileRule: { enabled: true, weight: 0.7, params: { profile_periods: 24, price_levels: 50, vol_threshold_pct: 0.02 } },
        volatilityExpansionRule: { enabled: true, weight: 0.6, params: { atr_period: 14, expansion_factor: 1.5, min_bars_above: 3 } },
        momentumThresholdRule: { enabled: true, weight: 0.8, params: { momentum_period: 14, threshold_mult: 1.0, consec_bars: 3 } },
        marketThrustRule: { enabled: true, weight: 0.8, params: { thrust_window: 20, volume_mult: 1.5, min_thrusts: 2 } },
        volumeBalanceRule: { enabled: true, weight: 0.6, params: { volume_ma_period: 20, obv_threshold: 0.1, price_confirm_pct: 0.01 } },
        gapAnalysisRule: { enabled: true, weight: 0.5, params: { min_gap_atr: 1.0, lookback_bars: 20, fill_threshold: 0.5 } },
        openingRangeBreakoutRule: { enabled: true, weight: 0.9, params: { range_minutes: 30, volume_threshold: 1000, breakout_confirm_ticks: 2 } },
        preMarketMomentumRule: { enabled: true, weight: 0.6, params: { premarket_minutes: 30, sgx_weight: 0.5, global_weight: 1.0, sectoral_weight: 0.5, volume_weight: 1.0 } },
        optionFlowRule: { enabled: true, weight: 0.6, params: { strikes_range: 5, min_oi_change: 1000, volume_threshold: 1000 } },
        optionGreeksRule: { enabled: true, weight: 0.5, params: { delta_threshold: 0.2, gamma_threshold: 0.1, vega_threshold: 0.05 } },
        dynamicSRRule: { enabled: true, weight: 0.7, params: { sr_lookback: 20, touch_threshold: 0.02, proximity_pct: 0.01 } },
        intradayCorrelationRule: { enabled: true, weight: 0.5, params: { correlation_window: 12, divergence_threshold: 0.5, confirmation_bars: 3 } },
        sectorRotationRule: { enabled: true, weight: 0.5, params: { momentum_window: 5, divergence_threshold: 0.5 } },
        adrPdrBreakoutRule: { enabled: true, weight: 0.6, params: { adr_period: 14, breakout_confirmation_atr: 2 } },
        marketProfileRule: { enabled: true, weight: 0.7, params: { profile_lookback_days: 5, value_area_pct: 0.7 } },
        liquidityGrabRule: { enabled: true, weight: 0.7, params: { sweep_buffer_ticks: 4, confirm_close_within: 3, lookback: 20 } },
        roundNumberMagnetRule: { enabled: true, weight: 0.4, params: { round_num_step: 100, tolerance_ticks: 5 } },
        orderflowDeltaRule: { enabled: true, weight: 0.9, params: { delta_window: 10, min_flip_z: 2.0, vwap_proximity_ticks: 3 } },
        macdCrossRule: { enabled: true, weight: 0.9, params: { fast: 12, slow: 26, signal: 9, min_hist_slope: 0.001 } },
        bollingerSqueezeRule: { enabled: true, weight: 0.8, params: { bb_len: 20, bb_sigma: 2, min_bandwidth: 0.001, follow_through_bars: 2 } },
        timePatternRule: { enabled: true, weight: 0.4, params: { windows: [{ start: '09:15', end: '09:30' }], volatility_threshold: 0.01, trend_threshold: 0.01, reversal_threshold: 0.02 } },
        // engine driver config
        compositeScore: { enabled: true, weight: 1.0, params: { signal_threshold: 0.6, cooldown_bars: 0 } }
    },
    regimeWeights: {
        TRENDING: { trendHTF: 1.2, swingBreak: 1.0, hhhlLLlh: 0.8 },
        RANGE: { trendHTF: 0.6, swingBreak: 1.2, hhhlLLlh: 1.0 },
        MEAN_REVERT: { trendHTF: 0.4, swingBreak: 1.0, hhhlLLlh: 1.2 }
    }
};
exports.default = defaultConfig;
