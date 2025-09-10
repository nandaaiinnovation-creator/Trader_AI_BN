import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

interface MarketProfile {
  poc: number; // Point of Control
  vah: number; // Value Area High
  val: number; // Value Area Low
}

export default class MarketProfileRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['profile_lookback_days', 'value_area_pct']);
    const { profile_lookback_days, value_area_pct } = this.config.params;

    const dailyHistory = context.marketState.dailyHistory;
    if (!dailyHistory || dailyHistory.length < profile_lookback_days) {
      return this.createResult(false, 0, 'Insufficient daily history for Market Profile');
    }

    const profile = this.calculateMarketProfile(dailyHistory.slice(-profile_lookback_days), value_area_pct);
    const currentPrice = context.candles[context.candles.length - 1].close;

    // Check for price relative to value area
    if (currentPrice > profile.vah) {
      const strength = Math.min((currentPrice - profile.vah) / (profile.vah - profile.poc), 1);
      return this.createResult(true, strength, `Price trading above Value Area High (${profile.vah.toFixed(2)})`);
    }

    if (currentPrice < profile.val) {
      const strength = Math.min((profile.val - currentPrice) / (profile.poc - profile.val), 1);
      return this.createResult(true, strength, `Price trading below Value Area Low (${profile.val.toFixed(2)})`);
    }

    // Check for price reaction at POC
    const proximityToPoc = Math.abs(currentPrice - profile.poc);
    if (proximityToPoc < (profile.vah - profile.val) * 0.05) { // Within 5% of VA range
        const strength = 1 - (proximityToPoc / ((profile.vah - profile.val) * 0.05));
        return this.createResult(true, strength, `Price testing Point of Control (${profile.poc.toFixed(2)})`);
    }

    return this.createResult(false, 0, `Price within Value Area (${profile.val.toFixed(2)} - ${profile.vah.toFixed(2)})`);
  }

  private calculateMarketProfile(days: any[], valueAreaPct: number): MarketProfile {
    const volumeProfile = new Map<number, number>();
    let totalVolume = 0;

    // Build a simple volume profile from daily data
    days.forEach(day => {
      const price = Math.round(day.close / 10) * 10; // Group prices
      const volume = day.volume;
      volumeProfile.set(price, (volumeProfile.get(price) || 0) + volume);
      totalVolume += volume;
    });

    // Find POC
    const sortedByVolume = [...volumeProfile.entries()].sort((a, b) => b[1] - a[1]);
    const poc = sortedByVolume[0][0];

    // Calculate Value Area
    let valueAreaVolume = 0;
    const valueAreaPrices: number[] = [];
    const targetVolume = totalVolume * (valueAreaPct / 100);

    for (const [price, volume] of sortedByVolume) {
      if (valueAreaVolume >= targetVolume) break;
      valueAreaVolume += volume;
      valueAreaPrices.push(price);
    }

    const vah = Math.max(...valueAreaPrices);
    const val = Math.min(...valueAreaPrices);

    return { poc, vah, val };
  }
}
