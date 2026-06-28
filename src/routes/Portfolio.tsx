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
  { key: "balanced", label: "균형형", desc: "주식 60 / 채권 40, 연 7~8% 목표", accent: "#E8F2FF", textAccent: "#3182F6" },
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
    const equal = Math.floor(100 / ps.length);
    const remainder = 100 - equal * ps.length;
    const w: Record<string, number> = {};
    ps.forEach((p, i) => {
      w[p.id] = equal + (i === 0 ? remainder : 0);
    });

    if (pk === "safe") {
      const bonds = ps.filter((p) => !isRisky(p));
      const stocks = ps.filter(isRisky);
      resetRatios(w, bonds, 80);
      resetRatios(w, stocks, 20);
    } else if (pk === "balanced") {
      const bonds = ps.filter((p) => !isRisky(p));
      const stocks = ps.filter(isRisky);
      resetRatios(w, stocks, 60);
      resetRatios(w, bonds, 40);
    } else {
      const bonds = ps.filter((p) => !isRisky(p));
      const stocks = ps.filter(isRisky);
      resetRatios(w, stocks, 70);
      resetRatios(w, bonds, 30);
    }
    setWeights(w);
  };

  const resetRatios = (w: Record<string, number>, ps: ProductSummary[], total: number) => {
    if (ps.length === 0) return;
    const each = Math.floor(total / ps.length);
    const rem = total - each * ps.length;
    ps.forEach((p, i) => {
      w[p.id] = each + (i === 0 ? rem : 0);
    });
  };

  const handlePreset = (pk: PresetKey) => {
    setPreset(pk);
    initWeights(products, pk);
  };

  const handleWeightChange = (id: string, val: number) => {
    setWeights((prev) => ({ ...prev, [id]: val }));
  };

  const totalWeight = useMemo(
    () => Object.values(weights).reduce((a, b) => a + b, 0),
    [weights]
  );

  const riskWeight = useMemo(
    () =>
      products
        .filter(isRisky)
        .reduce((acc, p) => acc + (weights[p.id] ?? 0), 0),
    [products, weights]
  );

  const expectedReturn = useMemo(() => {
    if (products.length === 0) return null;
    let sum = 0;
    let totalW = 0;
    for (const p of products) {
      const w = weights[p.id] ?? 0;
      if (p.return_1y != null) {
        sum += p.return_1y * w;
        totalW += w;
      }
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
    <div className="min-h-screen bg-white pb-10">
      {/* 헤더 */}
      <div className="page-header">
        <h1 className="page-header-title">내자산</h1>
      </div>

      {/* 총자산 히어로 */}
      <div className="px-5 pt-6 pb-5">
        <p className="text-[13px] text-toss-text-tertiary mb-1">시뮬레이션 원금</p>
        <p className="text-[36px] font-bold hero-number text-toss-text-primary">
          {formatKRW(PRINCIPAL)}
        </p>
        {expectedGain != null && (
          <div className="mt-2">
            <p className="text-[15px] text-toss-text-secondary">
              1년 후 예상{" "}
              <span className="font-bold text-toss-text-primary">{formatKRW(expectedAmt!)}</span>
            </p>
            <p
              className={`text-[14px] font-semibold tabular-nums mt-0.5 ${
                expectedGain >= 0 ? "text-toss-red" : "text-[#2468F6]"
              }`}
            >
              {expectedGain >= 0 ? "+" : ""}
              {formatKRW(expectedGain)} ({formatPercent(expectedReturn)})
            </p>
          </div>
        )}
      </div>

      {/* 위험 경고 */}
      {riskOver && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100">
          <p className="text-[13px] font-semibold text-toss-red">
            ⚠ 위험자산 비중 {riskWeight}% — 퇴직연금 한도(70%)를 초과했어요
          </p>
        </div>
      )}

      <div className="divider" />

      {/* 프리셋 */}
      <div className="px-5 py-5">
        <h2 className="text-[17px] font-bold mb-4">포트폴리오 유형</h2>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((pr) => (
            <button
              key={pr.key}
              onClick={() => handlePreset(pr.key)}
              className="rounded-2xl px-3 py-3 text-left transition-all"
              style={{
                background: preset === pr.key ? pr.accent : "#F2F4F6",
                border: `2px solid ${preset === pr.key ? pr.textAccent : "transparent"}`,
              }}
            >
              <p
                className="text-[13px] font-bold"
                style={{ color: preset === pr.key ? pr.textAccent : "#191F28" }}
              >
                {pr.label}
              </p>
              <p className="text-[11px] text-toss-text-tertiary mt-1 leading-tight">{pr.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="divider-line" />

      {/* 비중 조정 */}
      {products.length > 0 && (
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[17px] font-bold">비중 조정</h2>
            <span
              className={`text-[13px] font-semibold tabular-nums ${
                Math.abs(totalWeight - 100) < 1 ? "text-toss-green" : "text-toss-red"
              }`}
            >
              합계 {totalWeight}%
            </span>
          </div>

          {Array.from(grouped.entries()).map(([catLabel, ps]) => (
            <div key={catLabel} className="mb-5">
              <p className="text-[12px] font-semibold text-toss-text-tertiary uppercase tracking-wide mb-2">
                {catLabel}
              </p>
              {ps.map((p) => (
                <div key={p.id} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[13px] font-medium text-toss-text-primary truncate flex-1 mr-2">
                      {p.nickname || p.name}
                    </p>
                    <span className="text-[13px] font-bold text-toss-text-primary tabular-nums w-10 text-right">
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
          ))}
        </div>
      )}

      <div className="divider-line" />

      {/* 기대 수익 요약 */}
      <div className="px-5 py-5">
        <h2 className="text-[17px] font-bold mb-4">1년 시나리오</h2>
        <div className="grid grid-cols-2 gap-3">
          <ScenarioCard label="기대 수익률" value={formatPercent(expectedReturn)} color={expectedReturn != null && expectedReturn >= 0 ? "#F04452" : "#2468F6"} />
          <ScenarioCard label="위험자산 비중" value={`${riskWeight}%`} color={riskOver ? "#F04452" : "#0EBD8C"} />
        </div>
        <p className="text-[11px] text-toss-text-tertiary leading-relaxed mt-4">
          기대 수익률은 편입 상품의 1년 과거 수익률 가중 평균이며, 미래 수익을 보장하지 않습니다.
        </p>
      </div>
    </div>
  );
}

function ScenarioCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-toss-divider rounded-2xl px-4 py-4">
      <p className="text-[12px] text-toss-text-tertiary">{label}</p>
      <p className="text-[20px] font-bold tabular-nums mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
