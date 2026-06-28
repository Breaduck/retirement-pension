import type { ProductSummary } from "@/lib/data";
import { formatPercent } from "@/lib/format";

export default function RiskPanel({ p }: { p: ProductSummary }) {
  const cards: Array<{ label: string; value: string; sub?: string; color?: string }> = [];
  if (p.mdd_3y_pct !== undefined) {
    cards.push({
      label: "최대낙폭 (3년)",
      value: formatPercent(p.mdd_3y_pct, 1),
      sub: "최악일 때 이만큼 떨어진 적 있어요",
      color: "text-toss-red",
    });
  }
  if (p.annual_vol_pct !== undefined) {
    cards.push({
      label: "연 변동성",
      value: `±${p.annual_vol_pct.toFixed(1)}%`,
      sub: "1년에 평균 이만큼 출렁여요",
    });
  }
  if (p.sharpe_3y !== undefined) {
    cards.push({
      label: "위험대비 효율 (Sharpe)",
      value: p.sharpe_3y.toFixed(2),
      sub: ">1이면 위험 대비 잘 번 편",
      color:
        p.sharpe_3y >= 1
          ? "text-toss-green"
          : p.sharpe_3y >= 0.5
          ? "text-toss-yellow"
          : "text-toss-red",
    });
  }
  if (cards.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="text-[14px] font-semibold mb-2">위험 지표</div>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg bg-toss-bg p-3">
            <div className="text-[10px] text-toss-text-tertiary">{c.label}</div>
            <div
              className={
                "text-[15px] font-bold tabular-nums mt-0.5 " +
                (c.color ?? "text-toss-text-primary")
              }
            >
              {c.value}
            </div>
            {c.sub && (
              <div className="text-[10px] text-toss-text-tertiary leading-tight mt-0.5">
                {c.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
