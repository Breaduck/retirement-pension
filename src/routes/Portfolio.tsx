import { useEffect, useState, useMemo } from "react";
import { loadProducts, type ProductSummary, CATEGORY_LABEL } from "@/lib/data";
import { formatPercent, formatKRW } from "@/lib/format";

const PRINCIPAL = 65_000_000;
const RISK_LIMIT = 70;

function isRisky(p: ProductSummary): boolean {
  if (p.category === "bond" || p.category === "principal_guaranteed") return false;
  if (p.category === "tdf" && (p.tdf?.current_stock_pct ?? 100) < 40) return false;
  return true;
}

type PresetKey = "safe" | "balanced" | "aggressive";

const PRESETS: Array<{ key: PresetKey; label: string; desc: string; accent: string; textAccent: string }> = [
  { key: "safe", label: "안전형", desc: "채권 위주, 연 4~6% 목표", accent: "#E8F8F2", textAccent: "#0EBD8C" },
  { key: "balanced", label: "균형형 (추천)", desc: "주식 60 / 채권 40, 연 7~8% 목표", accent: "#E8F2FF", textAccent: "#3182F6" },
  { key: "aggressive", label: "공격형", desc: "주식 70%, 연 9~10% 목표", accent: "#FFF0F1", textAccent: "#F04452" },
];

export default function Portfolio() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [preset, setPreset] = useState<PresetKey>("balanced");
  const [weights, setWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    loadProducts().then((pf) => {
      setProducts(pf.products);
      initWeights(pf.products, "balanced");
    });
  }, []);

  const initWeights = (ps: ProductSummary[], pk: PresetKey) => {
    if (ps.length === 0) return;
    const w: Record<string, number> = {};
    ps.forEach((p) => { w[p.id] = 0; });
    const bonds = ps.filter((p) => !isRisky(p));
    const stocks = ps.filter(isRisky);
    if (pk === "safe") { resetRatios(w, bonds, 80); resetRatios(w, stocks, 20); }
    else if (pk === "balanced") { resetRatios(w, stocks, 60); resetRatios(w, bonds, 40); }
    else { resetRatios(w, stocks, 70); resetRatios(w, bonds, 30); }
    setWeights(w);
  };

  const resetRatios = (w: Record<string, number>, ps: ProductSummary[], total: number) => {
    if (ps.length === 0) return;
    const each = Math.floor(total / ps.length);
    const rem = total - each * ps.length;
    ps.forEach((p, i) => { w[p.id] = each + (i === 0 ? rem : 0); });
  };

  const handlePreset = (pk: PresetKey) => { setPreset(pk); initWeights(products, pk); };
  const handleWeightChange = (id: string, val: number) => setWeights((prev) => ({ ...prev, [id]: val }));

  const totalWeight = useMemo(() => Object.values(weights).reduce((a, b) => a + b, 0), [weights]);
  const riskWeight = useMemo(
    () => products.filter(isRisky).reduce((acc, p) => acc + (weights[p.id] ?? 0), 0),
    [products, weights]
  );
  const expectedReturn = useMemo(() => {
    if (products.length === 0) return null;
    let sum = 0, totalW = 0;
    for (const p of products) {
      const w = weights[p.id] ?? 0;
      if (p.return_1y != null && w > 0) { sum += p.return_1y * w; totalW += w; }
    }
    return totalW > 0 ? sum / totalW : null;
  }, [products, weights]);

  const expectedAmt = expectedReturn != null ? PRINCIPAL * (1 + expectedReturn / 100) : null;
  const expectedGain = expectedAmt != null ? expectedAmt - PRINCIPAL : null;
  const riskOver = riskWeight > RISK_LIMIT;

  const grouped = useMemo(() => {
    const map = new Map<string, ProductSummary[]>();
    for (const p of products) {
      const cat = CATEGORY_LABEL[p.category];
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return map;
  }, [products]);

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="page-title">내 자산 시뮬레이터</h1>
          <p className="page-subtitle">
            퇴직연금 원금 {formatKRW(PRINCIPAL)}을 어떻게 굴릴지 미리 그려보세요
          </p>
        </div>
      </div>

      {/* 상단 요약 카드 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="시뮬레이션 원금" value={formatKRW(PRINCIPAL)} sub="아빠 퇴직연금" />
        <SummaryCard
          label="1년 후 예상 자산"
          value={expectedAmt != null ? formatKRW(expectedAmt) : "—"}
          sub={expectedGain != null ? `${expectedGain >= 0 ? "+" : ""}${formatKRW(expectedGain)}` : ""}
          color={expectedGain != null && expectedGain >= 0 ? "#F04452" : "#2468F6"}
        />
        <SummaryCard
          label="기대 수익률"
          value={formatPercent(expectedReturn)}
          color={expectedReturn != null && expectedReturn >= 0 ? "#F04452" : "#2468F6"}
        />
        <SummaryCard
          label="위험자산 비중"
          value={`${riskWeight}%`}
          sub={`한도 ${RISK_LIMIT}%`}
          color={riskOver ? "#F04452" : "#0EBD8C"}
        />
      </div>

      {/* 위험 경고 */}
      {riskOver && (
        <div className="mb-6 px-5 py-4 rounded-2xl bg-rose-50 border border-rose-100">
          <p className="text-[14px] font-semibold text-toss-red">
            ⚠ 위험자산 비중 {riskWeight}% — 퇴직연금 규정상 한도(70%)를 초과했어요. 안전자산을 늘려주세요.
          </p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* 좌측: 프리셋 + 비중 조정 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* 프리셋 */}
          <div className="card p-7">
            <h2 className="section-title mb-5">포트폴리오 유형 선택</h2>
            <div className="grid grid-cols-3 gap-3">
              {PRESETS.map((pr) => (
                <button
                  key={pr.key}
                  onClick={() => handlePreset(pr.key)}
                  className="rounded-2xl px-5 py-5 text-left transition-all"
                  style={{
                    background: preset === pr.key ? pr.accent : "#F2F4F6",
                    border: `2px solid ${preset === pr.key ? pr.textAccent : "transparent"}`,
                  }}
                >
                  <p
                    className="text-[15px] font-bold"
                    style={{ color: preset === pr.key ? pr.textAccent : "#191F28" }}
                  >
                    {pr.label}
                  </p>
                  <p className="text-[12px] text-toss-text-tertiary mt-1.5 leading-snug">{pr.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 비중 조정 */}
          {products.length > 0 && (
            <div className="card p-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">비중 직접 조정</h2>
                <span className={`text-[13px] font-semibold tabular-nums ${Math.abs(totalWeight - 100) < 1 ? "text-toss-green" : "text-toss-red"}`}>
                  합계 {totalWeight}%
                </span>
              </div>

              {Array.from(grouped.entries()).map(([catLabel, ps]) => {
                const catTotal = ps.reduce((acc, p) => acc + (weights[p.id] ?? 0), 0);
                if (catTotal === 0) return null;
                return (
                  <div key={catLabel} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[13px] font-bold text-toss-text-secondary uppercase tracking-wide">{catLabel}</p>
                      <span className="text-[12px] font-semibold text-toss-text-tertiary tabular-nums">{catTotal}%</span>
                    </div>
                    {ps.filter((p) => (weights[p.id] ?? 0) > 0).map((p) => (
                      <div key={p.id} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[13px] font-medium text-toss-text-primary truncate flex-1 mr-3">
                            {p.nickname || p.name}
                          </p>
                          <span className="text-[13px] font-bold text-toss-text-primary tabular-nums w-12 text-right">
                            {weights[p.id] ?? 0}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={weights[p.id] ?? 0}
                          onChange={(e) => handleWeightChange(p.id, Number(e.target.value))}
                          className="w-full accent-toss-blue"
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 우측: 자산 배분 시각화 */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-20">
            <div className="card p-7">
              <h2 className="section-title mb-5">자산 배분</h2>
              <div className="space-y-3">
                {Array.from(grouped.entries()).map(([catLabel, ps]) => {
                  const catTotal = ps.reduce((acc, p) => acc + (weights[p.id] ?? 0), 0);
                  if (catTotal === 0) return null;
                  return (
                    <div key={catLabel}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] text-toss-text-secondary">{catLabel}</span>
                        <span className="text-[13px] font-bold text-toss-text-primary tabular-nums">{catTotal}%</span>
                      </div>
                      <div className="h-2 bg-toss-divider rounded-full overflow-hidden">
                        <div
                          className="h-full bg-toss-blue rounded-full transition-all"
                          style={{ width: `${catTotal}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-toss-text-tertiary leading-relaxed mt-6">
                기대 수익률은 편입 상품의 1년 과거 수익률 가중 평균이며, 미래 수익을 보장하지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card p-5">
      <p className="text-[12px] text-toss-text-tertiary mb-2">{label}</p>
      <p className="text-[22px] font-bold hero-number" style={{ color: color || "#191F28" }}>
        {value}
      </p>
      {sub && <p className="text-[12px] text-toss-text-tertiary mt-1 tabular-nums">{sub}</p>}
    </div>
  );
}
