import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProductSummary } from "@/lib/data";
import { CATEGORY_LABEL } from "@/lib/data";
import { formatPercent, colorForChange } from "@/lib/format";
import Sparkline from "./Sparkline";

const CAT_COLOR: Record<string, string> = {
  us_stock:             "bg-red-500",
  kr_stock:             "bg-rose-500",
  global_stock:         "bg-toss-blue",
  bond:                 "bg-emerald-500",
  reit_infra:           "bg-amber-500",
  commodity:            "bg-yellow-500",
  tdf:                  "bg-purple-500",
  principal_guaranteed: "bg-toss-text-tertiary",
};

const PERIODS = [
  { key: "1m" as const, label: "1개월" },
  { key: "3m" as const, label: "3개월" },
  { key: "6m" as const, label: "6개월" },
  { key: "1y" as const, label: "1년" },
  { key: "3y" as const, label: "3년" },
];

function returnByPeriod(p: ProductSummary, period: typeof PERIODS[number]["key"]) {
  return p[`return_${period}` as keyof ProductSummary] as number | undefined;
}

export default function FundDetailPreview({ product }: { product: ProductSummary | null }) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<typeof PERIODS[number]["key"]>("1y");

  // Reset period when product changes
  useEffect(() => {
    setPeriod("1y");
  }, [product?.id]);

  if (!product) {
    return (
      <div className="card h-full flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-[15px] font-semibold text-toss-text-secondary">
            왼쪽에서 펀드를 선택하세요
          </div>
          <div className="text-[13px] text-toss-text-tertiary mt-1">
            수익률 추이와 핵심 지표를 보여드려요
          </div>
        </div>
      </div>
    );
  }

  const initial = (product.nickname ?? product.name).trim().charAt(0) || "?";
  const v = returnByPeriod(product, period);

  // Build sparkline points from cumulative returns (3y → 1y → 6m → 3m → 1m → 0)
  const points = [
    product.return_3y,
    product.return_1y,
    product.return_6m,
    product.return_3m,
    product.return_1m,
    0,
  ].filter((x): x is number => x != null);

  const cleanName = (product.nickname ?? product.name).replace(/\[.*$/, "").trim();

  return (
    <div className="card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-toss-border flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold ${CAT_COLOR[product.category] ?? "bg-toss-text-tertiary"}`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-toss-text-primary truncate">
            {cleanName}
          </div>
          <div className="text-[12px] text-toss-text-tertiary">
            {CATEGORY_LABEL[product.category]}
            {product.risk_level && ` · ${product.risk_level}`}
          </div>
        </div>
      </div>

      {/* Big number */}
      <div className="px-5 pt-5 pb-3">
        <div className="text-[12px] text-toss-text-tertiary">
          {PERIODS.find((p) => p.key === period)?.label} 수익률
        </div>
        <div className={`text-[32px] font-extrabold tabular-nums tracking-tight mt-1 ${colorForChange(v)}`}>
          {v != null ? formatPercent(v, 2) : "—"}
        </div>
      </div>

      {/* Period selector */}
      <div className="px-5 pb-3 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 h-7 rounded-md text-[12px] font-semibold transition-colors ${
              period === p.key
                ? "bg-toss-text-primary text-white"
                : "text-toss-text-tertiary hover:bg-toss-divider"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="px-5 py-4 border-y border-toss-divider">
        <div className="flex items-end justify-center min-h-[140px]">
          <Sparkline
            points={points}
            color={v != null && v >= 0 ? "#F04452" : "#3182F6"}
            width={360}
            height={140}
            strokeWidth={2.5}
            fill
          />
        </div>
        <div className="flex justify-between text-[10px] text-toss-text-tertiary mt-1 tabular-nums">
          <span>3년 전</span>
          <span>1년 전</span>
          <span>6M</span>
          <span>3M</span>
          <span>1M</span>
          <span>지금</span>
        </div>
      </div>

      {/* Key stats */}
      <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3">
        <Stat label="1년 수익률" value={formatPercent(product.return_1y, 2)} color={colorForChange(product.return_1y)} />
        <Stat label="3년 수익률" value={formatPercent(product.return_3y, 2)} color={colorForChange(product.return_3y)} />
        <Stat
          label="총보수"
          value={product.expense_ratio != null ? `${product.expense_ratio.toFixed(2)}%` : "—"}
        />
        <Stat
          label="순자산"
          value={product.aum != null ? `${product.aum.toLocaleString()}억` : "—"}
        />
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 mt-auto">
        <button
          onClick={() => navigate(`/s/${product.id}`)}
          className="w-full h-11 rounded-xl bg-toss-text-primary text-white text-[14px] font-bold hover:bg-black/85 transition-colors"
        >
          상세 보기
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[11px] text-toss-text-tertiary">{label}</div>
      <div className={`text-[14px] font-bold tabular-nums mt-0.5 ${color ?? "text-toss-text-primary"}`}>
        {value}
      </div>
    </div>
  );
}
