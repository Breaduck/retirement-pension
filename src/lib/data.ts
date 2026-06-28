// 데이터 로더. SPA는 /data/products.json 하나만 fetch.
// 상세 시계열/보유종목은 /data/prices/<id>.json, /data/holdings/<id>.json로 lazy fetch.

export type Category =
  | "us_stock"
  | "kr_stock"
  | "global_stock"
  | "bond"
  | "reit_infra"
  | "commodity"
  | "tdf"
  | "principal_guaranteed";

export type ProductKind = "etf" | "tdf" | "fund" | "deposit";

export interface ProductSummary {
  id: string; // ETF는 티커, TDF는 자체 코드
  kind: ProductKind;
  ticker?: string; // KRX 티커 (ETF)
  name: string; // 공식명
  nickname?: string; // 한 줄 별칭 (이해용)
  one_line?: string; // 한 줄 설명
  category: Category;
  asset_manager?: string;
  benchmark?: string;
  benchmark_explainer?: string;
  expense_ratio?: number; // 총보수 (연 %)
  total_fees?: number; // 총비용 (총보수 + 기타)
  aum?: number; // 순자산 (원)
  last_price?: number;
  daily_change_pct?: number;
  return_1m?: number;
  return_3m?: number;
  return_1y?: number;
  return_3y?: number;
  ma200_pos_pct?: number; // 현재가 / 200일이평선 - 1
  rsi14?: number;
  price_percentile_1y?: number; // 0~100
  tdf?: {
    target_year: number;
    current_stock_pct?: number;
    current_bond_pct?: number;
    glide_path?: Array<{ year: number; stock_pct: number; bond_pct: number }>;
  };
  // 위험 지표
  mdd_3y_pct?: number; // 최근 3년 최대 낙폭 (음수)
  annual_vol_pct?: number; // 연환산 변동성
  sharpe_3y?: number;
  scenario_1y?: { p5: number; p50: number; p95: number }; // 1년 후 수익률 분포 (%)
  // 타이밍 종합 신호
  timing?: TimingSignal;
}

export type SignalColor = "green" | "yellow" | "red";

export interface TimingSignal {
  signal: SignalColor;
  headline: string;
  score: number; // 0~100, 높을수록 매수 적합
  axes: {
    trend: number; // 추세 (MA50 vs MA200, 200일 위/아래)
    momentum: number; // RSI 등 (역설계: 낮을수록 좋음 → 점수는 정방향)
    position: number; // 가격위치 (1Y 분위가 낮을수록 좋음 → 정방향)
    volatility: number; // 변동성 (낮을수록 안정)
    liquidity: number; // 유동성/거래량 (높을수록 좋음)
  };
  reasons: string[];
}

export interface ProductsFile {
  updated_at: string;
  source_note: string;
  products: ProductSummary[];
}

export interface PricePoint {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface IntradayPoint {
  time: string; // HH:MM
  price: number;
}

export interface PricesFile {
  id: string;
  ticker?: string;
  series: PricePoint[];
  intraday?: IntradayPoint[];
}

export interface Holding {
  name: string;
  weight_pct: number;
  ticker?: string;
}

export interface HoldingsFile {
  id: string;
  as_of?: string;
  holdings: Holding[];
}

export interface NewsItem {
  title: string;
  publisher: string;
  url: string;
  published_at: string;
}

export interface NewsFile {
  id: string;
  items: NewsItem[];
}

let _productsPromise: Promise<ProductsFile> | null = null;

export function loadProducts(): Promise<ProductsFile> {
  if (!_productsPromise) {
    _productsPromise = fetch("/data/products.json", { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error("products.json fetch failed");
        return r.json() as Promise<ProductsFile>;
      })
      .catch((e) => {
        _productsPromise = null;
        throw e;
      });
  }
  return _productsPromise;
}

export async function loadPrices(id: string): Promise<PricesFile | null> {
  const r = await fetch(`/data/prices/${encodeURIComponent(id)}.json`, {
    cache: "no-cache",
  });
  if (!r.ok) return null;
  return r.json();
}

export async function loadHoldings(id: string): Promise<HoldingsFile | null> {
  const r = await fetch(`/data/holdings/${encodeURIComponent(id)}.json`, {
    cache: "no-cache",
  });
  if (!r.ok) return null;
  return r.json();
}

export async function loadNews(id: string): Promise<NewsFile | null> {
  const r = await fetch(`/data/news/${encodeURIComponent(id)}.json`, {
    cache: "no-cache",
  });
  if (!r.ok) return null;
  return r.json();
}

export const CATEGORY_LABEL: Record<Category, string> = {
  us_stock: "미국주식",
  kr_stock: "한국주식",
  global_stock: "글로벌주식",
  bond: "채권",
  reit_infra: "리츠/인프라",
  commodity: "원자재",
  tdf: "TDF",
  principal_guaranteed: "원리금보장",
};
