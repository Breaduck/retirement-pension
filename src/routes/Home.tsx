import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadProducts, ProductSummary, Category, CATEGORY_LABEL } from "../lib/data";
import { formatPercent, colorForChange } from "../lib/format";

const CHIPS: Array<{ value: Category | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "us_stock", label: "미국주식" },
  { value: "kr_stock", label: "한국주식" },
  { value: "global_stock", label: "글로벌주식" },
  { value: "tdf", label: "TDF" },
  { value: "bond", label: "채권" },
  { value: "reit_infra", label: "리츠/인프라" },
  { value: "commodity", label: "원자재" },
  { value: "principal_guaranteed", label: "원리금보장" },
];

type SortKey = "return_1y" | "return_3y" | "expense_ratio" | "name";

export default function Home() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("return_1y");
  const [sortDesc, setSortDesc] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts().then((p) => {
      setProducts(p.products);
      setUpdatedAt(p.updated_at);
    });
  }, []);

  const filtered = useMemo(
    () => (category === "all" ? products : products.filter((p) => p.category === category)),
    [products, category]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any, bv: any;
      if (sortBy === "name") {
        av = a.nickname || a.name; bv = b.nickname || b.name;
        return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      av = (a as any)[sortBy] ?? -Infinity;
      bv = (b as any)[sortBy] ?? -Infinity;
      return sortDesc ? bv - av : av - bv;
    });
    return arr;
  }, [filtered, sortBy, sortDesc]);

  const featured = useMemo(
    () => products
      .filter((p) => p.return_1y != null)
      .sort((a, b) => (b.return_1y ?? 0) - (a.return_1y ?? 0))
      .slice(0, 3),
    [products]
  );

  const safeBondTop = useMemo(
    () => products
      .filter((p) => p.category === "bond" && p.return_1y != null)
      .sort((a, b) => (b.return_1y ?? 0) - (a.return_1y ?? 0))
      .slice(0, 5),
    [products]
  );

  const tdfTop = useMemo(
    () => products
      .filter((p) => p.category === "tdf" && p.return_1y != null)
      .sort((a, b) => (b.return_1y ?? 0) - (a.return_1y ?? 0))
      .slice(0, 5),
    [products]
  );

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : `${d.getMonth() + 1}월 ${d.getDate()}일 기준`;
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDesc(!sortDesc);
    else { setSortBy(key); setSortDesc(true); }
  };

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="page-title">신한투자증권 퇴직연금</h1>
          <p className="page-subtitle">
            실적배당상품 {products.length}개 · {updatedAt && fmtDate(updatedAt)}
          </p>
        </div>
      </div>

      {/* 카테고리 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
        {CHIPS.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`chip${category === c.value ? " active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 메인 그리드: 좌측 큰 테이블 + 우측 사이드 */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* 좌측: 종목 테이블 */}
        <div className="col-span-12 lg:col-span-8">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-toss-border">
              <h2 className="section-title">
                {category === "all" ? "전체 상품" : CATEGORY_LABEL[category as Category]}
                <span className="text-toss-text-tertiary font-medium ml-2 text-[14px]">
                  {sorted.length}개
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th onClick={() => handleSort("name")} className="cursor-pointer">상품명</th>
                    <th className="num cursor-pointer" onClick={() => handleSort("return_1y")}>
                      1년 수익률 {sortBy === "return_1y" ? (sortDesc ? "↓" : "↑") : ""}
                    </th>
                    <th className="num cursor-pointer" onClick={() => handleSort("return_3y")}>
                      3년
                    </th>
                    <th className="num cursor-pointer" onClick={() => handleSort("expense_ratio")}>
                      보수
                    </th>
                    <th className="num">카테고리</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-toss-text-tertiary">상품이 없습니다</td></tr>
                  ) : (
                    sorted.map((p, idx) => (
                      <tr key={p.id} onClick={() => navigate(`/s/${p.id}`)}>
                        <td className="text-toss-text-tertiary text-[13px]">{idx + 1}</td>
                        <td>
                          <p className="font-semibold text-toss-text-primary leading-tight">
                            {p.nickname || p.name}
                          </p>
                          {p.nickname && p.name !== p.nickname && (
                            <p className="text-[12px] text-toss-text-tertiary mt-0.5 truncate max-w-md">
                              {p.name}
                            </p>
                          )}
                        </td>
                        <td className={`num font-bold ${colorForChange(p.return_1y)}`}>
                          {p.return_1y != null ? formatPercent(p.return_1y) : "—"}
                        </td>
                        <td className={`num ${colorForChange(p.return_3y)}`}>
                          {p.return_3y != null ? formatPercent(p.return_3y) : "—"}
                        </td>
                        <td className="num text-toss-text-secondary">
                          {p.expense_ratio != null ? `${p.expense_ratio.toFixed(2)}%` : "—"}
                        </td>
                        <td className="num">
                          <span className="badge-gray">{CATEGORY_LABEL[p.category]}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 우측 사이드 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <SidePanel title="1년 수익률 TOP 3" items={featured} navigate={navigate} highlight />
          <SidePanel title="TDF 인기 5" items={tdfTop} navigate={navigate} />
          <SidePanel title="채권형 TOP 5" items={safeBondTop} navigate={navigate} />
        </div>
      </div>
    </div>
  );
}

function SidePanel({
  title,
  items,
  navigate,
  highlight,
}: {
  title: string;
  items: ProductSummary[];
  navigate: (path: string) => void;
  highlight?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-toss-border">
        <h3 className="text-[15px] font-bold text-toss-text-primary">{title}</h3>
      </div>
      <div className="divide-y divide-toss-divider">
        {items.length === 0 ? (
          <div className="px-5 py-6 text-center text-[13px] text-toss-text-tertiary">데이터 없음</div>
        ) : (
          items.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => navigate(`/s/${p.id}`)}
              className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-toss-divider/50 transition-colors"
            >
              <span className={`text-[13px] font-bold w-5 ${highlight && idx < 3 ? "text-toss-blue" : "text-toss-text-tertiary"}`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-toss-text-primary truncate">
                  {p.nickname || p.name}
                </p>
                <p className="text-[11px] text-toss-text-tertiary mt-0.5">
                  {CATEGORY_LABEL[p.category]}
                </p>
              </div>
              {p.return_1y != null && (
                <span className={`text-[13px] font-bold tabular-nums ${colorForChange(p.return_1y)}`}>
                  {formatPercent(p.return_1y)}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
