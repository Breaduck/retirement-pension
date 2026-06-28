import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadProducts,
  type ProductSummary,
  type Category,
  CATEGORY_LABEL,
} from "@/lib/data";
import { formatPercent, colorForChange } from "@/lib/format";
import { getWatchlist, toggleWatchlist } from "@/lib/watchlist";
import MarketOverview from "@/components/MarketOverview";
import TabNav, { type TabKey } from "@/components/TabNav";
import FundDetailPreview from "@/components/FundDetailPreview";
import WatchlistPanel from "@/components/WatchlistPanel";

type Region = "all" | "kr" | "global";
type SortKey = "return_1y" | "return_3y" | "return_6m" | "expense_ratio" | "aum";

const SORT_CHIPS: Array<{ key: SortKey; label: string; desc: boolean }> = [
  { key: "return_1y",     label: "1년 수익률",  desc: true  },
  { key: "return_3y",     label: "3년 수익률",  desc: true  },
  { key: "return_6m",     label: "6개월 수익률", desc: true  },
  { key: "expense_ratio", label: "보수 낮은순", desc: false },
  { key: "aum",           label: "AUM 큰순",     desc: true  },
];

const CATEGORY_CHIPS: Array<{ key: Category | "all"; label: string }> = [
  { key: "all",                  label: "전체" },
  { key: "us_stock",             label: "미국주식" },
  { key: "kr_stock",             label: "한국주식" },
  { key: "global_stock",         label: "글로벌주식" },
  { key: "bond",                 label: "채권" },
  { key: "tdf",                  label: "TDF" },
  { key: "reit_infra",           label: "리츠/인프라" },
];

const RISK_CHIPS: Array<{ key: string; label: string }> = [
  { key: "all",        label: "전체" },
  { key: "매우높은위험", label: "매우 높음" },
  { key: "높은위험",     label: "높음" },
  { key: "다소높은위험", label: "다소 높음" },
  { key: "보통위험",     label: "보통" },
  { key: "낮은위험",     label: "낮음" },
];

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

const REGION_MAP: Record<Region, Category[] | null> = {
  all:    null,
  kr:     ["kr_stock"],
  global: ["us_stock", "global_stock"],
};

export default function Home() {
  const navigate = useNavigate();
  const [products,    setProducts]    = useState<ProductSummary[]>([]);
  const [updatedAt,   setUpdatedAt]   = useState<string | null>(null);
  const [tab,         setTab]         = useState<TabKey>("realtime");
  const [region,      setRegion]      = useState<Region>("all");
  const [sortBy,      setSortBy]      = useState<SortKey>("return_1y");
  const [categoryF,   setCategoryF]   = useState<Category | "all">("all");
  const [riskF,       setRiskF]       = useState<string>("all");
  const [hideHighRisk,setHideHighRisk]= useState(false);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [bannerOpen,  setBannerOpen]  = useState(true);
  const [watchIds,    setWatchIds]    = useState<string[]>([]);

  useEffect(() => {
    loadProducts().then((pf) => {
      setProducts(pf.products);
      setUpdatedAt(pf.updated_at);
      setWatchIds(getWatchlist());
      if (pf.products.length > 0) {
        const top = [...pf.products]
          .filter((p) => p.return_1y != null)
          .sort((a, b) => (b.return_1y ?? 0) - (a.return_1y ?? 0))[0];
        if (top) setSelectedId(top.id);
      }
    });
  }, []);

  const filtered = useMemo(() => {
    let list = products;

    // Region filter
    const cats = REGION_MAP[region];
    if (cats) list = list.filter((p) => cats.includes(p.category));

    // Tab-specific extra filter
    if (tab === "category" && categoryF !== "all") {
      list = list.filter((p) => p.category === categoryF);
    }
    if (tab === "risk" && riskF !== "all") {
      list = list.filter((p) => p.risk_level === riskF);
    }

    // High-risk hide
    if (hideHighRisk) {
      list = list.filter((p) => p.risk_level !== "매우높은위험");
    }

    return list;
  }, [products, region, tab, categoryF, riskF, hideHighRisk]);

  const sorted = useMemo(() => {
    const chip = SORT_CHIPS.find((c) => c.key === sortBy)!;
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return chip.desc ? bv - av : av - bv;
    });
  }, [filtered, sortBy]);

  const selected = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId]
  );

  const baseDate = updatedAt ? new Date(updatedAt) : null;
  const dateLabel = baseDate
    ? `${baseDate.getFullYear()}.${String(baseDate.getMonth() + 1).padStart(2, "0")}.${String(baseDate.getDate()).padStart(2, "0")}`
    : "—";

  const handleHeart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleWatchlist(id);
    setWatchIds(getWatchlist());
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Promo banner ── */}
      {bannerOpen && (
        <div className="banner-promo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>퇴직연금 펀드 153개 · {dateLabel} 기준</span>
          <span className="promo-cta" onClick={() => navigate("/me")}>
            내 연금 보러가기 ›
          </span>
          <span className="promo-close" onClick={() => setBannerOpen(false)}>
            ✕
          </span>
        </div>
      )}

      {/* ── Market Overview ── */}
      <MarketOverview products={products} />

      {/* ── Tabs ── */}
      <div className="mt-2">
        <TabNav value={tab} onChange={setTab} />
      </div>

      {/* ── Filter row ── */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Region toggle group */}
        <div className="toggle-group">
          <button
            className={`toggle-btn${region === "all" ? " active" : ""}`}
            onClick={() => setRegion("all")}
          >
            전체
          </button>
          <button
            className={`toggle-btn${region === "kr" ? " active" : ""}`}
            onClick={() => setRegion("kr")}
          >
            국내
          </button>
          <button
            className={`toggle-btn${region === "global" ? " active" : ""}`}
            onClick={() => setRegion("global")}
          >
            해외
          </button>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {tab === "realtime" &&
            SORT_CHIPS.map((c) => (
              <button
                key={c.key}
                onClick={() => setSortBy(c.key)}
                className={`chip-sm${sortBy === c.key ? " active" : ""}`}
              >
                {c.label}
              </button>
            ))}
          {tab === "category" &&
            CATEGORY_CHIPS.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategoryF(c.key)}
                className={`chip-sm${categoryF === c.key ? " active" : ""}`}
              >
                {c.label}
              </button>
            ))}
          {tab === "risk" &&
            RISK_CHIPS.map((c) => (
              <button
                key={c.key}
                onClick={() => setRiskF(c.key)}
                className={`chip-sm${riskF === c.key ? " active" : ""}`}
              >
                {c.label}
              </button>
            ))}
        </div>

        {/* Right side toggle */}
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-toss-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={hideHighRisk}
              onChange={(e) => setHideHighRisk(e.target.checked)}
              className="w-4 h-4 accent-toss-blue"
            />
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
              투자위험 펀드 숨기기
            </span>
          </label>
        </div>
      </div>

      {/* ── 3-column body ── */}
      <div className="grid grid-cols-12 gap-4 mt-1">
        {/* Left: ranked fund list */}
        <div className="col-span-12 lg:col-span-5">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-toss-border">
              <div className="flex items-center gap-2 text-[12px] text-toss-text-tertiary">
                <span>순위 · 어제 16:00 기준</span>
              </div>
              <div className="text-[12px] text-toss-text-tertiary tabular-nums">
                {sorted.length}개
              </div>
            </div>

            {/* Column header */}
            <div
              className="grid items-center gap-3 px-3 h-9 text-[11px] font-medium text-toss-text-tertiary border-b border-toss-divider"
              style={{ gridTemplateColumns: "24px 24px 36px 1fr 90px 80px" }}
            >
              <div></div>
              <div>#</div>
              <div></div>
              <div>펀드명</div>
              <div className="text-right">
                {SORT_CHIPS.find((c) => c.key === sortBy)?.label}
              </div>
              <div className="text-right">순자산</div>
            </div>

            {/* Rows */}
            <div className="max-h-[640px] overflow-y-auto">
              {sorted.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-toss-text-tertiary">
                  조건에 맞는 펀드가 없어요
                </div>
              ) : (
                sorted.slice(0, 60).map((p, idx) => {
                  const sel = p.id === selectedId;
                  const liked = watchIds.includes(p.id);
                  const sortVal = (p as any)[sortBy] as number | undefined;
                  const initial =
                    (p.nickname ?? p.name).trim().charAt(0) || "?";
                  const cleanName = (p.nickname ?? p.name).replace(/\[.*$/, "").trim();
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`fund-row${sel ? " selected" : ""}`}
                    >
                      <span
                        onClick={(e) => handleHeart(e, p.id)}
                        className="cursor-pointer"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "#F04452" : "none"} stroke={liked ? "#F04452" : "#B0B8C1"} strokeWidth="2">
                          <path d="M12 21s-7-4.35-9.5-9.5C1 8 3.5 4 7.5 4c2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4 20.5 4 23 8 21.5 11.5 19 16.65 12 21 12 21z" />
                        </svg>
                      </span>
                      <span className="text-[13px] text-toss-text-tertiary font-semibold tabular-nums">
                        {idx + 1}
                      </span>
                      <div
                        className={`fund-logo ${CAT_COLOR[p.category] ?? "bg-toss-text-tertiary"}`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-toss-text-primary truncate">
                          {cleanName}
                        </div>
                        <div className="text-[11px] text-toss-text-tertiary truncate">
                          {CATEGORY_LABEL[p.category]}
                          {p.risk_level && ` · ${p.risk_level}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-[14px] font-bold tabular-nums ${
                            sortBy.startsWith("return")
                              ? colorForChange(sortVal as number | null)
                              : "text-toss-text-primary"
                          }`}
                        >
                          {sortVal != null
                            ? sortBy === "expense_ratio"
                              ? `${(sortVal as number).toFixed(2)}%`
                              : sortBy === "aum"
                              ? `${(sortVal as number).toLocaleString()}억`
                              : formatPercent(sortVal as number, 2)
                            : "—"}
                        </div>
                      </div>
                      <div className="text-right text-[12px] text-toss-text-secondary tabular-nums">
                        {p.aum != null ? `${p.aum.toLocaleString()}억` : "—"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Middle: selected fund detail */}
        <div className="col-span-12 lg:col-span-4">
          <FundDetailPreview product={selected} />
        </div>

        {/* Right: watchlist sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <WatchlistPanel
            products={products}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}
