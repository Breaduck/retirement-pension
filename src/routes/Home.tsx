import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadProducts, ProductSummary, Category, CATEGORY_LABEL } from "../lib/data";
import { formatPercent, colorForChange } from "../lib/format";
import CategoryChips from "../components/CategoryChips";
import SectionHeader from "../components/SectionHeader";

export default function Home() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | "all">("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts().then((p) => {
      setProducts(p.products);
      setUpdatedAt(p.updated_at);
    });
  }, []);

  const featured = useMemo(
    () =>
      products
        .filter((p) => p.timing?.signal === "green")
        .sort((a, b) => (b.timing?.score ?? 0) - (a.timing?.score ?? 0))
        .slice(0, 3),
    [products]
  );

  const top1y = useMemo(
    () =>
      products
        .filter((p) => p.return_1y != null)
        .sort((a, b) => (b.return_1y ?? 0) - (a.return_1y ?? 0))
        .slice(0, 5),
    [products]
  );

  const filtered = useMemo(
    () => (category === "all" ? products : products.filter((p) => p.category === category)),
    [products, category]
  );

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")} 기준`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="page-header">
        <h1 className="page-header-title flex-1">아빠 퇴직연금</h1>
        {updatedAt && (
          <span className="text-[12px] text-toss-text-tertiary tabular-nums">{fmtDate(updatedAt)}</span>
        )}
      </div>

      {/* 카테고리 칩 */}
      <CategoryChips selected={category} onChange={setCategory} />

      {/* 오늘 주목 (전체일 때만) */}
      {category === "all" && featured.length > 0 && (
        <section>
          <SectionHeader title="오늘 주목" />
          <div className="overflow-x-auto px-5 pb-2" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-3" style={{ width: "max-content" }}>
              {featured.map((p) => (
                <FeaturedCard key={p.id} product={p} onClick={() => navigate(`/s/${p.id}`)} />
              ))}
            </div>
          </div>
          <div className="divider-line mt-2" />
        </section>
      )}

      {/* 1년 수익률 TOP (전체일 때만) */}
      {category === "all" && top1y.length > 0 && (
        <section>
          <SectionHeader title="1년 수익률 TOP" />
          {top1y.map((p) => (
            <StockRow key={p.id} product={p} onClick={() => navigate(`/s/${p.id}`)} />
          ))}
          <div className="divider mt-2" />
        </section>
      )}

      {/* 전체 리스트 */}
      <section>
        <SectionHeader
          title={category === "all" ? "전체 상품" : CATEGORY_LABEL[category]}
        />
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-toss-text-tertiary text-[14px]">
            상품 정보를 불러오는 중…
          </div>
        ) : (
          filtered.map((p) => (
            <StockRow key={p.id} product={p} onClick={() => navigate(`/s/${p.id}`)} />
          ))
        )}
        <div className="h-4" />
      </section>
    </div>
  );
}

function FeaturedCard({ product: p, onClick }: { product: ProductSummary; onClick: () => void }) {
  const r1y = p.return_1y;
  const cls = colorForChange(r1y);
  return (
    <div onClick={onClick} className="stock-card-big">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2 h-2 rounded-full flex-none"
          style={{ background: p.timing?.signal === "green" ? "#0EBD8C" : "#8B95A1" }}
        />
        <span className="text-[11px] text-toss-text-tertiary">{CATEGORY_LABEL[p.category]}</span>
      </div>
      <p className="text-[14px] font-bold text-toss-text-primary leading-tight line-clamp-2">
        {p.nickname || p.name}
      </p>
      {r1y != null && (
        <p className={`text-[20px] font-bold hero-number mt-1 ${cls}`}>
          {formatPercent(r1y)}
        </p>
      )}
      <p className="text-[11px] text-toss-text-tertiary mt-0.5">1년 수익률</p>
    </div>
  );
}

function StockRow({ product: p, onClick }: { product: ProductSummary; onClick: () => void }) {
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
              : p.timing?.signal === "yellow"
              ? "#FFA800"
              : p.timing?.signal === "red"
              ? "#F04452"
              : "#E5E8EB",
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-toss-text-primary truncate">
          {p.nickname || p.name}
        </p>
        <p className="text-[12px] text-toss-text-tertiary truncate mt-0.5">
          {CATEGORY_LABEL[p.category]}
          {p.expense_ratio != null ? ` · 보수 ${p.expense_ratio.toFixed(2)}%` : ""}
        </p>
      </div>
      <div className="text-right flex-none">
        {r1y != null ? (
          <>
            <p className={`text-[15px] font-bold tabular-nums ${cls}`}>{formatPercent(r1y)}</p>
            <p className="text-[11px] text-toss-text-tertiary mt-0.5">1년</p>
          </>
        ) : (
          <p className="text-[15px] text-toss-text-tertiary">—</p>
        )}
      </div>
    </div>
  );
}
