import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProducts, ProductSummary, CATEGORY_LABEL } from "../lib/data";
import { getWatchlist, removeFromWatchlist } from "../lib/watchlist";
import { formatPercent, colorForChange } from "../lib/format";

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
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="page-title">관심 종목</h1>
          <p className="page-subtitle">
            별표로 저장한 상품을 모아봤어요 · {watched.length}개
          </p>
        </div>
      </div>

      {watched.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="text-5xl">⭐</span>
            <p className="text-[18px] font-bold text-toss-text-primary">아직 관심 종목이 없어요</p>
            <p className="text-[14px] text-toss-text-tertiary">
              상품 상세에서 별 아이콘을 누르면 여기 모아볼 수 있어요
            </p>
            <button onClick={() => navigate("/")} className="btn-primary mt-2">상품 둘러보기</button>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="stock-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>상품명</th>
                  <th className="num">1년</th>
                  <th className="num">3년</th>
                  <th className="num">보수</th>
                  <th className="num">카테고리</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {watched.map((p, idx) => (
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
                    <td>
                      <button
                        onClick={(e) => handleRemove(e, p.id)}
                        className="text-toss-text-tertiary hover:text-toss-red transition-colors p-1"
                        aria-label="관심 해제"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
