import type { ProductSummary } from "@/lib/data";

interface Props {
  p: ProductSummary;
  principalKRW?: number; // 기본 6500만원
}

export default function ScenarioBands({ p, principalKRW = 65_000_000 }: Props) {
  if (!p.scenario_1y) return null;
  const { p5, p50, p95 } = p.scenario_1y;
  const principalMan = principalKRW / 10_000;
  const wonAt = (pct: number) => Math.round((principalKRW * (1 + pct / 100)) / 10_000);

  // 막대 시각화용: -50 ~ +50을 0~100% 매핑
  const min = Math.min(-30, p5 - 2);
  const max = Math.max(30, p95 + 2);
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[14px] font-semibold">
          {principalMan.toLocaleString()}만원을 1년 보유하면
        </div>
        <div className="text-[10px] text-toss-text-tertiary">통계 기반 추정</div>
      </div>
      <p className="text-[11px] text-toss-text-tertiary leading-relaxed mb-3">
        과거 변동성을 토대로 한 1년 후 수익률 분포. 실제는 더 좋거나 더 나쁠 수 있어요.
      </p>

      <div className="relative h-8 rounded-full bg-toss-divider overflow-hidden mb-2">
        {/* 5~95 구간 */}
        <div
          className="absolute top-0 bottom-0 bg-toss-blue/25"
          style={{ left: `${pos(p5)}%`, right: `${100 - pos(p95)}%` }}
        />
        {/* 중앙선 (0%) */}
        <div
          className="absolute top-0 bottom-0 w-px bg-toss-text-tertiary/50"
          style={{ left: `${pos(0)}%` }}
        />
        {/* 중앙값 (p50) */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-toss-blue rounded-full"
          style={{ left: `calc(${pos(p50)}% - 2px)` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <ScenarioBox
          label="나쁜 해 (하위 5%)"
          pct={p5}
          principalMan={principalMan}
          wonMan={wonAt(p5)}
          color="text-toss-red"
        />
        <ScenarioBox
          label="평균"
          pct={p50}
          principalMan={principalMan}
          wonMan={wonAt(p50)}
          color={p50 >= 0 ? "text-toss-green" : "text-toss-red"}
        />
        <ScenarioBox
          label="좋은 해 (상위 5%)"
          pct={p95}
          principalMan={principalMan}
          wonMan={wonAt(p95)}
          color="text-toss-green"
        />
      </div>
    </div>
  );
}

function ScenarioBox({
  label,
  pct,
  principalMan,
  wonMan,
  color,
}: {
  label: string;
  pct: number;
  principalMan: number;
  wonMan: number;
  color: string;
}) {
  const delta = wonMan - principalMan;
  return (
    <div className="rounded-lg bg-toss-bg p-3">
      <div className="text-[10px] text-toss-text-tertiary">{label}</div>
      <div className={"text-[15px] font-bold tabular-nums mt-0.5 " + color}>
        {pct > 0 ? "+" : ""}
        {pct.toFixed(1)}%
      </div>
      <div className="text-[10px] text-toss-text-secondary tabular-nums mt-0.5">
        {wonMan.toLocaleString()}만원
      </div>
      <div className={"text-[10px] tabular-nums " + (delta >= 0 ? "text-toss-green" : "text-toss-red")}>
        ({delta >= 0 ? "+" : ""}
        {delta.toLocaleString()}만)
      </div>
    </div>
  );
}
