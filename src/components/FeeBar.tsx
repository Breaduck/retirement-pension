export default function FeeBar({
  expense,
  categoryAvg,
}: {
  expense?: number;
  categoryAvg?: number;
}) {
  // 시각화를 위해 최대치 추정
  const max = Math.max(expense ?? 0, categoryAvg ?? 0, 1.0);

  const pct = (v?: number) =>
    v === undefined ? 0 : Math.min(100, (v / max) * 100);

  return (
    <div className="card p-4">
      <div className="text-[14px] font-semibold mb-2">수수료</div>
      <div className="space-y-3">
        <Row
          label="이 상품 총보수"
          value={expense}
          pct={pct(expense)}
          highlight
        />
        {categoryAvg !== undefined && (
          <Row
            label="같은 카테고리 평균"
            value={categoryAvg}
            pct={pct(categoryAvg)}
          />
        )}
      </div>
      <p className="mt-3 text-[11px] text-toss-text-tertiary leading-relaxed">
        총보수는 1년에 자산 대비 자동 차감되는 비용입니다. 0.1%p 차이도 10년이면
        체감됩니다.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  pct,
  highlight,
}: {
  label: string;
  value?: number;
  pct: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12px]">
        <span className="text-toss-text-secondary">{label}</span>
        <span className="tabular-nums font-semibold">
          {value !== undefined ? `${value.toFixed(2)}%` : "—"}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-toss-divider overflow-hidden">
        <div
          className={
            "h-full rounded-full " +
            (highlight ? "bg-toss-blue" : "bg-toss-text-tertiary/60")
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
