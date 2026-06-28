import { useEffect, useState } from "react";
import type { ProductSummary } from "@/lib/data";
import { CATEGORY_LABEL } from "@/lib/data";
import { formatPercent, colorForChange } from "@/lib/format";
import { getWatchlist, toggleWatchlist } from "@/lib/watchlist";

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

function FundLogo({ category, name }: { category: string; name: string }) {
  const initial = name.trim().charAt(0) || "?";
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 ${CAT_COLOR[category] ?? "bg-toss-text-tertiary"}`}
    >
      {initial}
    </div>
  );
}

type Props = {
  products: ProductSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function WatchlistPanel({ products, selectedId, onSelect }: Props) {
  const [watchIds, setWatchIds] = useState<string[]>([]);

  useEffect(() => {
    setWatchIds(getWatchlist());
  }, []);

  const watchProducts = watchIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is ProductSummary => !!p);

  const fallbackTop10 = [...products]
    .filter((p) => p.return_1y != null)
    .sort((a, b) => (b.return_1y ?? 0) - (a.return_1y ?? 0))
    .slice(0, 10);

  const usingWatchlist = watchProducts.length > 0;
  const items = usingWatchlist ? watchProducts : fallbackTop10;

  const headerLabel = usingWatchlist ? "관심 펀드" : "1년 수익률 TOP 10";

  const aiHighlight = fallbackTop10[0];

  const handleToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleWatchlist(id);
    setWatchIds(getWatchlist());
  };

  return (
    <div className="card overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 flex items-center justify-between border-b border-toss-border">
        <h3 className="text-[16px] font-bold text-toss-text-primary">관심</h3>
        <div className="text-[11px] text-toss-text-tertiary">$ 원</div>
      </div>

      {/* AI Highlight */}
      {aiHighlight && (
        <div className="px-5 py-3.5 border-b border-toss-divider">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-toss-blue-light text-toss-blue text-[10px] font-bold">
              ✨ 펀드 AI
            </span>
          </div>
          <p className="text-[13px] font-semibold text-toss-text-primary line-clamp-2 leading-snug">
            <span className="truncate">{(aiHighlight.nickname ?? aiHighlight.name).slice(0, 18)}</span>{" "}
            <span className={colorForChange(aiHighlight.return_1y)}>
              {formatPercent(aiHighlight.return_1y, 1)}
            </span>{" "}
            <span className="text-toss-text-tertiary font-normal">올해 가장 높은 수익률</span>
          </p>
        </div>
      )}

      {/* Title bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="text-[14px] font-bold text-toss-text-primary">{headerLabel}</div>
        <div className="text-[11px] text-toss-text-tertiary mt-0.5">
          {usingWatchlist ? `${items.length}개 관심 펀드` : "관심 그룹에 담아보세요"}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-toss-text-tertiary">
            펀드가 없습니다
          </div>
        ) : (
          items.map((p) => {
            const sel = p.id === selectedId;
            const liked = watchIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={`watch-row w-full ${sel ? "selected" : ""}`}
              >
                <FundLogo category={p.category} name={p.nickname ?? p.name} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-semibold text-toss-text-primary truncate">
                    {(p.nickname ?? p.name).replace(/\[.*$/, "").trim()}
                  </p>
                  <p className="text-[11px] text-toss-text-tertiary truncate mt-0.5">
                    {CATEGORY_LABEL[p.category]}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-[13px] font-bold tabular-nums ${colorForChange(p.return_1y)}`}>
                    {formatPercent(p.return_1y, 1)}
                  </div>
                  {p.return_1m != null && (
                    <div className={`text-[10px] tabular-nums ${colorForChange(p.return_1m)}`}>
                      1M {formatPercent(p.return_1m, 1)}
                    </div>
                  )}
                </div>
                <span
                  onClick={(e) => handleToggle(e, p.id)}
                  className="ml-1 cursor-pointer"
                  title={liked ? "관심 해제" : "관심 추가"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "#F04452" : "none"} stroke={liked ? "#F04452" : "#B0B8C1"} strokeWidth="2">
                    <path d="M12 21s-7-4.35-9.5-9.5C1 8 3.5 4 7.5 4c2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4 20.5 4 23 8 21.5 11.5 19 16.65 12 21 12 21z" />
                  </svg>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
