interface PivotPoints {
    highs: number[];
    lows: number[];
}

export function findPivots(data: number[], window: number): PivotPoints {
    const highs: number[] = [];
    const lows: number[] = [];
    
    if (data.length < window * 2 + 1) {
        return { highs, lows };
    }

    // Find pivot points
    for (let i = window; i < data.length - window; i++) {
        let isHigh = true;
        let isLow = true;

        // Check if current point is higher than all points in window
        for (let j = i - window; j <= i + window; j++) {
            if (j !== i) {
                if (data[j] >= data[i]) isHigh = false;
                if (data[j] <= data[i]) isLow = false;
            }
        }

        if (isHigh) highs.push(i);
        if (isLow) lows.push(i);
    }

    return { highs, lows };
}
