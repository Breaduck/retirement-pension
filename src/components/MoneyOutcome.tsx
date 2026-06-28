import type { ProductSummary } from "@/lib/data";

interface Props {
  p: ProductSummary;
  principalKRW?: number;
}

export default function MoneyOutcome({
  p,
  principalKRW = 65_000_000,
}: Props) {
  if (!p.scenario_1y) return null;
  const { p5, p50, p95 } = p.scenario_1y;
  const principalMan = principalKRW / 10_000;
  const wonMan = (pct: number) =>
    Math.round((principalKRW * (1 + pct / 100)) / 10_000);
  const delta = (pct: number) => wonMan(pct) - principalMan;

  return (
    <div className="card p-5">
      <div className="text-[11px] font-bold tracking-wider uppercase text-toss-text-tertiary">
        {principalMan.toLocaleString()}만원 넣으면 1년 뒤
      </div>

      {/* 평균 — 가장 큰 */}
      <div className="mt-3">
        <div className="text-[10px] text-toss-text-tertiary">평균적인 해</div>
        <div className="flex items-baseline gap-2 mt-1">
          <div
            className={
              "text-[34px] font-extrabold tabular-nums leading-none " +
              (p50 >= 0 ? "text-toss-red" : "text-toss-blue")
            }
          >
            {wonMan(p50).toLocaleString()}
            <span className="text-[18px] ml-0.5">만</span>
          </div>
          <div
            className={
              "text-[14px] font-bold tabular-nums " +
              (p50 >= 0 ? "text-toss-red" : "text-toss-blue")
            }
          >
            {p50 >= 0 ? "+" : ""}
            {p50.toFixed(1)}%
          </div>
        </div>
        <div
          className={
            "text-[11px] tabular-nums mt-0.5 " +
            (delta(p50) >= 0 ? "text-toss-red" : "text-toss-blue")
          }
        >
          {delta(p50) >= 0 ? "+" : ""}
          {delta(p50).toLocaleString()}만원
        </div>
      </div>

      {/* 최악 / 최선 */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="rounded-lg bg-toss-bg p-3">
          <div className="text-[10px] text-toss-text-tertiary">
            최악의 해 (하위 5%)
          </div>
          <div className="text-[18px] font-extrabold tabular-nums text-toss-blue mt-0.5">
            {wonMan(p5).toLocaleString()}만
          </div>
          <div className="text-[11px] tabular-nums text-toss-blue">
            {p5 >= 0 ? "+" : ""}
            {p5.toFixed(1)}% ({delta(p5).toLocaleString()}만)
          </div>
        </div>
        <div className="rounded-lg bg-toss-bg p-3">
          <div className="text-[10px] text-toss-text-tertiary">
            최선의 해 (상위 5%)
          </div>
          <div className="text-[18px] font-extrabold tabular-nums text-toss-red mt-0.5">
            {wonMan(p95).toLocaleString()}만
          </div>
          <div className="text-[11px] tabular-nums text-toss-red">
            +{p95.toFixed(1)}% (+{delta(p95).toLocaleString()}만)
          </div>
        </div>
      </div>

      <div className="text-[10px] text-toss-text-tertiary mt-3 leading-relaxed">
        과거 변동성 기반 통계 추정. 미래를 보장하지 않아요.
      </div>
    </div>
  );
}
