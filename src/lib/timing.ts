import type { PricePoint } from "./data";

export interface TimingSignals {
  last_close: number;
  ma200?: number;
  ma200_pos_pct?: number; // (현재가 - MA200) / MA200 * 100
  rsi14?: number;
  price_percentile_1y?: number; // 0~100 (현재가가 1년 분포에서 몇 % 위치)
}

export function computeSignals(series: PricePoint[]): TimingSignals | null {
  if (!series || series.length === 0) return null;
  const closes = series.map((p) => p.close);
  const last = closes[closes.length - 1];

  const ma200 =
    closes.length >= 200
      ? avg(closes.slice(closes.length - 200))
      : undefined;
  const ma200_pos_pct =
    ma200 !== undefined ? ((last - ma200) / ma200) * 100 : undefined;

  const rsi14 = closes.length >= 15 ? rsi(closes, 14) : undefined;

  const oneYear = closes.slice(Math.max(0, closes.length - 252));
  const sorted = [...oneYear].sort((a, b) => a - b);
  const rank = sorted.findIndex((v) => v >= last);
  const price_percentile_1y =
    oneYear.length > 0
      ? Math.round(((rank < 0 ? oneYear.length : rank) / oneYear.length) * 100)
      : undefined;

  return {
    last_close: last,
    ma200,
    ma200_pos_pct,
    rsi14,
    price_percentile_1y,
  };
}

function avg(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function rsi(closes: number[], period: number): number {
  let gain = 0;
  let loss = 0;
  // 초기 평균
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  // Wilder smoothing
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
