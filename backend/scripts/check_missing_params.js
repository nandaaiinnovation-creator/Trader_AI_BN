const path = require('path');
const cfg = require('../dist/config/rules').default;

const required = {
  trendHTF: ['ema_fast','ema_slow','confirm_bars'],
  swingBreak: ['lookback_swing','close_buffer_ticks'],
  hhhlLLlh: ['pivots_window','min_leg_size_atr'],
  trendlineBreak: ['pivots_window','break_buffer','min_volume_z'],
  vwapBias: ['vwap_dev_sigma'],
  rsiAdaptive: ['rsi_len','upper','lower','cooldown_bars'],
  volumeClimaxRule: ['volume_ma_period','climax_mult','price_reversal_pct'],
  momentumDivergenceRule: ['rsi_period','pivot_window','min_div_bars'],
  meanReversionRule: ['bb_period','bb_std','min_vol_ratio','mean_revert_bars'],
  volumeProfileRule: ['profile_periods','price_levels','vol_threshold_pct'],
  volatilityExpansionRule: ['atr_period','expansion_factor','min_bars_above'],
  momentumThresholdRule: ['momentum_period','threshold_mult','consec_bars'],
  marketThrustRule: ['thrust_window','volume_mult','min_thrusts'],
  volumeBalanceRule: ['volume_ma_period','obv_threshold','price_confirm_pct'],
  gapAnalysisRule: ['min_gap_atr','lookback_bars','fill_threshold'],
  openingRangeBreakoutRule: ['range_minutes','volume_threshold','breakout_confirm_ticks'],
  preMarketMomentumRule: ['sgx_weight','global_weight','sectoral_weight','volume_weight'],
  optionFlowRule: ['strikes_range','min_oi_change','volume_threshold'],
  timePatternRule: ['volatility_threshold','trend_threshold','reversal_threshold'],
  dynamicSRRule: ['sr_lookback','touch_threshold','proximity_pct'],
  intradayCorrelationRule: ['correlation_window','divergence_threshold','confirmation_bars'],
  optionGreeksRule: ['delta_threshold','gamma_threshold','vega_threshold'],
  sectorRotationRule: ['momentum_window','divergence_threshold'],
  adrPdrBreakoutRule: ['adr_period','breakout_confirmation_atr'],
  marketProfileRule: ['profile_lookback_days','value_area_pct'],
  liquidityGrabRule: ['sweep_buffer_ticks','confirm_close_within','lookback'],
  roundNumberMagnetRule: ['round_num_step','tolerance_ticks'],
  orderflowDeltaRule: ['delta_window','min_flip_z','vwap_proximity_ticks'],
  macdCrossRule: ['fast','slow','signal','min_hist_slope'],
  bollingerSqueezeRule: ['bb_len','bb_sigma','min_bandwidth','follow_through_bars']
};

const missing = {};
for (const [rule, reqs] of Object.entries(required)){
  const entry = cfg.rules[rule];
  const params = entry && entry.params ? entry.params : {};
  const miss = reqs.filter(k => !(k in params));
  if (miss.length) missing[rule] = miss;
}

console.log(JSON.stringify(missing, null, 2));
process.exit(0);
