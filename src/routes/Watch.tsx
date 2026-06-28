import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProducts, ProductSummary, CATEGORY_LABEL } from "../lib/data";
import { getWatchlist, removeFromWatchlist } from "../lib/watchlist";
import { formatPercent, colorForChange } from "../lib/format";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";

export default function Watch() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [watchIds, setWatchIds] = useState<string[]>([]);
  const navigate = useNavigate();

  const refresh = () => setWatchIds(getWatchlist());

  useEffect(() => {
    refresh();
    loadProducts().then((p) => setProducts(p.products));
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const watched = products.filter((p) => watchIds.includes(p.id));

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromWatchlist(id);
    refresh();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="page-header">
        <h1 className="page-header-title flex-1">관심</h1>
        {watched.length > 0 && (
          <span className="text-[13px] text-toss-text-tertiary">{watched.length}개</span>
        )}
      </div>

      {watched.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="아직 관심 종목이 없어요"
          description="상품 상세에서 별 아이콘을 누르면 여기 모아볼 수 있어요"
          ctaLabel="상품 둘러보기"
          ctaTo="/"
        />
      ) : (
        <>
          <SectionHeader title="관심 종목" />
          {watched.map((p) => (
            <WatchRow
              key={p.id}
              product={p}
              onClick={() => navigate(`/s/${p.id}`)}
              onRemove={(e) => handleRemove(e, p.id)}
            />
          ))}
          <div className="h-8" />
        </>
      )}
    </div>
  );
}

function WatchRow({
  product: p,
  onClick,
  onRemove,
}: {
  product: ProductSummary;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const r1y = p.return_1y;
  const cls = colorForChange(r1y);

  return (
    <div onClick={onClick} className="stock-row">
      <span
        className="w-2 h-2 rounded-full flex-none mt-0.5"
        style={{
          background:
            p.timing?.signal === "green"
              ? "#0EBD8C"
              : p.timing?.signal === "red"
              ? "#F04452"
              : "#E5E8EB",
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-toss-text-primary truncate">
          {p.nickname || p.name}
        </p>
        <p className="text-[12px] text-toss-text-tertiary mt-0.5">{CATEGORY_LABEL[p.category]}</p>
      </div>
      <div className="text-right flex-none mr-3">
        {r1y != null ? (
          <>
            <p className={`text-[15px] font-bold tabular-nums ${cls}`}>{formatPercent(r1y)}</p>
            <p className="text-[11px] text-toss-text-tertiary mt-0.5">1년</p>
          </>
        ) : (
          <p className="text-[15px] text-toss-text-tertiary">—</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-toss-text-tertiary"
        aria-label="관심 해제"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
