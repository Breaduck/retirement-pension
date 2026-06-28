import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  loadProducts,
  loadPrices,
  loadHoldings,
  loadNews,
  type ProductSummary,
  type PricesFile,
  type HoldingsFile,
  type NewsFile,
  CATEGORY_LABEL,
} from "@/lib/data";
import { formatPercent, formatKRW, colorForChange } from "@/lib/format";
import { isInWatchlist, toggleWatchlist } from "@/lib/watchlist";
import PriceChart from "@/components/PriceChart";
import HoldingsDonut from "@/components/HoldingsDonut";
import NewsList from "@/components/NewsList";
import GlidePathChart from "@/components/GlidePathChart";
import DecisionHero from "@/components/DecisionHero";
import MoneyOutcome from "@/components/MoneyOutcome";
import FeeBar from "@/components/FeeBar";
import RiskPanel from "@/components/RiskPanel";
import NameExplainer from "@/components/NameExplainer";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [prices, setPrices] = useState<PricesFile | null>(null);
  const [holdings, setHoldings] = useState<HoldingsFile | null>(null);
  const [news, setNews] = useState<NewsFile | null>(null);
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setWatching(isInWatchlist(id));
    setLoading(true);
    loadProducts().then((pf) => {
      const p = pf.products.find((x) => x.id === id) ?? null;
      setProduct(p);
      setLoading(false);
    });
    loadPrices(id).then(setPrices);
    loadHoldings(id).then(setHoldings);
    loadNews(id).then(setNews);
  }, [id]);

  const handleToggleWatch = () => {
    if (!id) return;
    setWatching(toggleWatchlist(id));
  };

  if (loading) {
    return (
      <div className="container-wide py-8">
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-toss-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-wide py-8">
        <div className="empty-state">
          <p className="text-[20px] font-bold">상품을 찾을 수 없어요</p>
          <button onClick={() => navigate("/")} className="text-toss-blue font-semibold">홈으로</button>
        </div>
      </div>
    );
  }

  const r1y = product.return_1y;
  const rd = product.daily_change_pct;

  return (
    <div className="container-wide py-8">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[13px] text-toss-text-tertiary hover:text-toss-text-primary mb-6 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        목록으로
      </button>

      {/* 종목 헤더 */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-gray">{CATEGORY_LABEL[product.category]}</span>
            {product.kind && (
              <span className="badge-gray uppercase">{product.kind === "tdf" ? "TDF" : product.kind === "etf" ? "ETF" : "펀드"}</span>
            )}
          </div>
          <h1 className="text-[28px] font-bold text-toss-text-primary leading-tight tracking-tight">
            {product.nickname || product.name}
          </h1>
          {product.nickname && (
            <p className="text-[14px] text-toss-text-tertiary mt-1.5">{product.name}</p>
          )}
        </div>
        <button onClick={handleToggleWatch} className="btn-icon" aria-label={watching ? "관심 해제" : "관심 추가"}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill={watching ? "#3182F6" : "none"} stroke={watching ? "#3182F6" : "currentColor"} strokeWidth={1.8}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* 좌측 메인 (8 col) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* 가격 + 차트 카드 */}
          <div className="card p-7">
            {product.last_price != null ? (
              <>
                <p className="hero-number text-[44px] text-toss-text-primary leading-none">
                  {product.last_price.toLocaleString()}
                  <span className="text-[20px] ml-1.5 font-semibold text-toss-text-secondary">원</span>
                </p>
                {rd != null && (
                  <p className={`text-[15px] mt-2 tabular-nums ${colorForChange(rd)}`}>
                    {rd > 0 ? "▲" : rd < 0 ? "▼" : ""} {Math.abs(rd).toFixed(2)}% 오늘
                  </p>
                )}
              </>
            ) : (
              r1y != null && (
                <>
                  <p className="text-[14px] text-toss-text-tertiary mb-1">최근 1년 수익률</p>
                  <p className={`hero-number text-[44px] ${colorForChange(r1y)}`}>
                    {formatPercent(r1y)}
                  </p>
                </>
              )
            )}

            {prices && (
              <div className="mt-6 -mx-2">
                <PriceChart series={prices.series} intraday={prices.intraday} />
              </div>
            )}
          </div>

          {/* 의사결정 */}
          {product.timing && (
            <div className="card p-7">
              <h2 className="section-title mb-5">오늘의 판단</h2>
              <DecisionHero p={product} />
            </div>
          )}

          {/* 종목 설명 */}
          <div className="card p-7">
            <h2 className="section-title mb-5">이 상품 한 줄 요약</h2>
            <NameExplainer p={product} />
          </div>

          {/* 기간 수익률 */}
          <div className="card p-7">
            <h2 className="section-title mb-5">기간별 수익률</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "1개월", v: product.return_1m },
                { label: "3개월", v: product.return_3m },
                { label: "1년", v: product.return_1y },
                { label: "3년", v: product.return_3y },
              ].map(({ label, v }) => (
                <div key={label} className="card-flat px-4 py-5 text-center">
                  <p className="text-[12px] text-toss-text-tertiary mb-2">{label}</p>
                  <p className={`text-[18px] font-bold tabular-nums ${colorForChange(v)}`}>
                    {v != null ? formatPercent(v) : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 위험 지표 */}
          {(product.mdd_3y_pct != null || product.annual_vol_pct != null) && (
            <div className="card p-7">
              <h2 className="section-title mb-5">위험 지표</h2>
              <RiskPanel p={product} />
            </div>
          )}

          {/* 시나리오 */}
          {product.scenario_1y && (
            <div className="card p-7">
              <MoneyOutcome p={product} />
            </div>
          )}

          {/* TDF 글라이드패스 */}
          {product.tdf?.glide_path && product.tdf.glide_path.length > 0 && (
            <div className="card p-7">
              <h2 className="section-title mb-5">자산배분 경로</h2>
              <GlidePathChart series={product.tdf.glide_path} targetYear={product.tdf.target_year} />
            </div>
          )}

          {/* 보유 종목 */}
          {holdings && holdings.holdings.length > 0 && (
            <div className="card p-7">
              <h2 className="section-title mb-5">구성 종목</h2>
              <HoldingsDonut holdings={holdings.holdings} />
            </div>
          )}

          {/* 뉴스 */}
          {news && news.items.length > 0 && (
            <div className="card p-7">
              <h2 className="section-title mb-5">관련 뉴스</h2>
              <NewsList items={news.items} />
            </div>
          )}
        </div>

        {/* 우측 사이드 (4 col, sticky) */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            {/* 액션 카드 */}
            <div className="card p-6">
              <p className="text-[13px] text-toss-text-tertiary mb-1">신한투자증권 MTS에서</p>
              <p className="text-[15px] font-bold text-toss-text-primary mb-4">
                실제 매수가 가능해요
              </p>
              <a
                href="https://www.shinhansec.com/"
                target="_blank"
                rel="noopener"
                className="btn-primary w-full"
              >
                매수하러 가기
              </a>
              <button
                onClick={handleToggleWatch}
                className="btn-secondary w-full mt-2"
              >
                {watching ? "관심 해제" : "관심 추가"}
              </button>
            </div>

            {/* 핵심 지표 요약 */}
            <div className="card p-6">
              <h3 className="text-[14px] font-bold text-toss-text-primary mb-4">핵심 지표</h3>
              <div className="space-y-3">
                <InfoRow label="1년 수익률" value={r1y != null ? formatPercent(r1y) : "—"} color={colorForChange(r1y)} />
                <InfoRow label="3년 수익률" value={product.return_3y != null ? formatPercent(product.return_3y) : "—"} color={colorForChange(product.return_3y)} />
                <InfoRow label="총보수" value={product.expense_ratio != null ? `${product.expense_ratio.toFixed(3)}%` : "—"} />
                <InfoRow label="운용규모" value={product.aum != null ? formatKRW(product.aum) : "—"} />
                {product.asset_manager && <InfoRow label="운용사" value={product.asset_manager} />}
                {product.benchmark && <InfoRow label="벤치마크" value={product.benchmark} />}
                {product.tdf?.target_year && <InfoRow label="목표연도" value={`${product.tdf.target_year}`} />}
              </div>
              {product.expense_ratio != null && (
                <div className="mt-5 pt-5 border-t border-toss-border">
                  <p className="text-[12px] text-toss-text-tertiary mb-2">카테고리 평균 대비</p>
                  <FeeBar expense={product.expense_ratio} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-toss-text-tertiary leading-relaxed mt-8">
        이 정보는 투자 판단 참고용이며 매수 추천이 아닙니다. 실제 매매는 신한투자증권 MTS에서 본인 판단으로 진행하세요.
      </p>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-toss-text-tertiary">{label}</span>
      <span className={`text-[14px] font-semibold tabular-nums ${color || "text-toss-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}
