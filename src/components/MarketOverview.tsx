import { useMemo } from "react";
import type { Category, ProductSummary } from "@/lib/data";
import CategoryStatCard from "./CategoryStatCard";

type CatStat = {
  category: Category;
  title: string;
  avg1y: number | null;
  avg1m: number | null;
  best: number | null;
  worst: number | null;
  count: number;
  spark: number[];
};

function summarize(products: ProductSummary[], category: Category, title: string): CatStat {
  const list = products.filter((p) => p.category === category);
  const r1y = list.map((p) => p.return_1y).filter((v): v is number => v != null);
  const r1m = list.map((p) => p.return_1m).filter((v): v is number => v != null);
  const r3m = list.map((p) => p.return_3m).filter((v): v is number => v != null);
  const r6m = list.map((p) => p.return_6m).filter((v): v is number => v != null);
  const r3y = list.map((p) => p.return_3y).filter((v): v is number => v != null);

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  const avg1y = mean(r1y);
  const avg1m = mean(r1m);
  const avg3m = mean(r3m);
  const avg6m = mean(r6m);
  const avg3y = mean(r3y);

  // Cumulative-style sparkline: 3y → 1y → 6m → 3m → 1m → "now"
  // Using cumulative returns (highest baseline first) as a visual proxy for trend.
  const spark = [avg3y, avg1y, avg6m, avg3m, avg1m, 0].filter((v): v is number => v != null);

  return {
    category,
    title,
    avg1y,
    avg1m,
    best:  r1y.length ? Math.max(...r1y) : null,
    worst: r1y.length ? Math.min(...r1y) : null,
    count: list.length,
    spark,
  };
}

export default function MarketOverview({ products }: { products: ProductSummary[] }) {
  const stats = useMemo(() => {
    return {
      global:    summarize(products, "global_stock",         "글로벌 주식 펀드"),
      kr:        summarize(products, "kr_stock",             "한국 주식 펀드"),
      bond:      summarize(products, "bond",                 "채권 펀드"),
      tdf:       summarize(products, "tdf",                  "TDF (생애주기)"),
      us:        summarize(products, "us_stock",             "미국 주식 펀드"),
      reit:      summarize(products, "reit_infra",           "리츠·인프라"),
      commodity: summarize(products, "commodity",            "원자재"),
    };
  }, [products]);

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Big card - 글로벌 주식 (가장 많은 카테고리) */}
      <div className="col-span-12 lg:col-span-4">
        <CategoryStatCard
          variant="big"
          title={stats.global.title}
          value={stats.global.avg1y}
          delta={stats.global.avg1m}
          sparkPoints={stats.global.spark}
          hi={stats.global.best}
          lo={stats.global.worst}
          caption={`${stats.global.count}개 펀드 평균 · 1년 수익률 기준`}
        />
      </div>

      {/* 3 medium cards - 한국주식 / 채권 / TDF */}
      <div className="col-span-12 lg:col-span-5 grid grid-cols-3 gap-3">
        <CategoryStatCard
          variant="medium"
          title={stats.kr.title}
          value={stats.kr.avg1y}
          delta={stats.kr.avg1m}
          sparkPoints={stats.kr.spark}
        />
        <CategoryStatCard
          variant="medium"
          title={stats.bond.title}
          value={stats.bond.avg1y}
          delta={stats.bond.avg1m}
          sparkPoints={stats.bond.spark}
        />
        <CategoryStatCard
          variant="medium"
          title={stats.tdf.title}
          value={stats.tdf.avg1y}
          delta={stats.tdf.avg1m}
          sparkPoints={stats.tdf.spark}
        />
        <CategoryStatCard
          variant="text"
          title="미국 주식 펀드"
          value={stats.us.avg1y}
        />
        <CategoryStatCard
          variant="text"
          title="리츠·인프라"
          value={stats.reit.avg1y}
        />
        <CategoryStatCard
          variant="text"
          title="원자재"
          value={stats.commodity.avg1y}
        />
      </div>

      {/* Tall right - 데이터 안내 */}
      <div className="col-span-12 lg:col-span-3">
        <div className="card p-5 h-full flex flex-col">
          <div className="market-card-title mb-3">주요 일정</div>
          <ul className="flex flex-col gap-3 text-[13px] text-toss-text-secondary">
            <li className="flex gap-3">
              <span className="text-toss-text-tertiary tabular-nums">D-7</span>
              <span>다음 펀드 수익률 갱신 예정</span>
            </li>
            <li className="flex gap-3">
              <span className="text-toss-text-tertiary tabular-nums">06.26</span>
              <span>현재 데이터 기준일</span>
            </li>
            <li className="flex gap-3">
              <span className="text-toss-text-tertiary tabular-nums">분기</span>
              <span>TDF 글라이드패스 점검</span>
            </li>
          </ul>
          <div className="mt-auto pt-4 border-t border-toss-divider">
            <a
              href="https://www.shinhansec.com/"
              target="_blank"
              rel="noopener"
              className="text-[12px] font-semibold text-toss-blue hover:underline"
            >
              신한투자증권 펀드 안내 ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
