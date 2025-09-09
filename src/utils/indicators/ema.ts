export function ema(data: number[], period: number): number[] {
    const result: number[] = [];
    if (data.length < period) {
        return result;
    }

    // First value is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    result.push(sum / period);

    // Multiplier for EMA calculation
    const multiplier = 2 / (period + 1);

    // Calculate subsequent EMAs
    for (let i = period; i < data.length; i++) {
        const ema = (data[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
        result.push(ema);
    }

    return result;
}
