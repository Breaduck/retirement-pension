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
import ActionBar from "@/components/ActionBar";

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
    const next = toggleWatchlist(id);
    setWatching(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-toss-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-[17px] font-bold">상품을 찾을 수 없어요</p>
        <button onClick={() => navigate("/")} className="text-toss-blue font-semibold">홈으로</button>
      </div>
    );
  }

  const r1y = product.return_1y;
  const rd = product.daily_change_pct;
  const deltaClass = colorForChange(rd ?? r1y);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 고정 헤더 */}
      <div className="page-header">
        <button
          onClick={() => navigate(-1)}
          className="mr-3 -ml-1 p-1"
          aria-label="뒤로"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="page-header-title flex-1 truncate text-[15px]">
          {product.nickname || product.name}
        </span>
        <button
          onClick={handleToggleWatch}
          className="p-1"
          aria-label={watching ? "관심 해제" : "관심 추가"}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill={watching ? "#3182F6" : "none"}
            stroke={watching ? "#3182F6" : "#8B95A1"}
            strokeWidth={1.8}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 가격 히어로 */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-[13px] text-toss-text-tertiary mb-1">{CATEGORY_LABEL[product.category]}</p>
        <h1 className="text-[15px] font-semibold text-toss-text-secondary leading-tight mb-3 line-clamp-2">
          {product.name}
        </h1>
        {product.last_price != null ? (
          <>
            <p className="text-[36px] font-bold hero-number text-toss-text-primary">
              {product.last_price.toLocaleString()}
              <span className="text-[18px] ml-1 font-semibold text-toss-text-secondary">원</span>
            </p>
            {rd != null && (
              <p className={`text-[15px] mt-1 tabular-nums ${deltaClass}`}>
                {rd > 0 ? "▲" : rd < 0 ? "▼" : ""}
                {Math.abs(rd).toFixed(2)}% 오늘
              </p>
            )}
          </>
        ) : (
          r1y != null && (
            <p className={`text-[28px] font-bold hero-number ${deltaClass}`}>
              {formatPercent(r1y)}
              <span className="text-[15px] ml-1 font-medium text-toss-text-tertiary">1년 수익률</span>
            </p>
          )
        )}
      </div>

      {/* 차트 */}
      {prices && (
        <div className="pb-2">
          <PriceChart series={prices.series} intraday={prices.intraday} />
        </div>
      )}

      <div className="divider" />

      {/* 오늘의 판단 */}
      {product.timing && (
        <div className="px-5 py-5">
          <DecisionHero p={product} />
        </div>
      )}

      <div className="divider-line" />

      {/* 종목 설명 */}
      <div className="px-5 py-5">
        <NameExplainer p={product} />
      </div>

      <div className="divider-line" />

      {/* 운용 정보 */}
      <div className="px-5 py-5">
        <h3 className="text-[15px] font-bold text-toss-text-primary mb-4">운용 정보</h3>
        <div className="grid grid-cols-2 gap-y-4">
          {product.expense_ratio != null && (
            <InfoItem label="총보수" value={`${product.expense_ratio.toFixed(3)}%`} />
          )}
          {product.total_fees != null && (
            <InfoItem label="총비용" value={`${product.total_fees.toFixed(3)}%`} />
          )}
          {product.aum != null && (
            <InfoItem label="순자산" value={formatKRW(product.aum)} />
          )}
          {product.asset_manager && (
            <InfoItem label="운용사" value={product.asset_manager} />
          )}
          {product.benchmark && (
            <InfoItem label="벤치마크" value={product.benchmark} />
          )}
        </div>
        {product.expense_ratio != null && (
          <div className="mt-4">
            <FeeBar expense={product.expense_ratio} />
          </div>
        )}
      </div>

      <div className="divider-line" />

      {/* 기간별 수익률 */}
      <div className="px-5 py-5">
        <h3 className="text-[15px] font-bold text-toss-text-primary mb-4">기간별 수익률</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "1개월", v: product.return_1m },
            { label: "3개월", v: product.return_3m },
            { label: "1년", v: product.return_1y },
            { label: "3년", v: product.return_3y },
          ].map(({ label, v }) => (
            <div key={label} className="text-center">
              <p className={`text-[16px] font-bold tabular-nums ${colorForChange(v)}`}>
                {v != null ? formatPercent(v) : "—"}
              </p>
              <p className="text-[11px] text-toss-text-tertiary mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="divider-line" />

      {/* 위험 지표 */}
      {(product.mdd_3y_pct != null || product.annual_vol_pct != null) && (
        <>
          <div className="px-5 py-5">
            <h3 className="text-[15px] font-bold text-toss-text-primary mb-4">위험 지표</h3>
            <RiskPanel p={product} />
          </div>
          <div className="divider-line" />
        </>
      )}

      {/* 6500만원이면? */}
      {product.scenario_1y && (
        <>
          <div className="px-5 py-5">
            <MoneyOutcome p={product} />
          </div>
          <div className="divider-line" />
        </>
      )}

      {/* TDF 글라이드패스 */}
      {product.tdf?.glide_path && product.tdf.glide_path.length > 0 && (
        <>
          <div className="px-5 py-5">
            <h3 className="text-[15px] font-bold text-toss-text-primary mb-4">자산배분 경로</h3>
            <GlidePathChart
              series={product.tdf.glide_path}
              targetYear={product.tdf.target_year}
            />
          </div>
          <div className="divider-line" />
        </>
      )}

      {/* 보유 종목 */}
      {holdings && holdings.holdings.length > 0 && (
        <>
          <div className="px-5 py-5">
            <h3 className="text-[15px] font-bold text-toss-text-primary mb-4">구성 종목</h3>
            <HoldingsDonut holdings={holdings.holdings} />
          </div>
          <div className="divider-line" />
        </>
      )}

      {/* 관련 뉴스 */}
      {news && news.items.length > 0 && (
        <div className="px-5 py-5">
          <h3 className="text-[15px] font-bold text-toss-text-primary mb-4">관련 뉴스</h3>
          <NewsList items={news.items} />
        </div>
      )}

      {/* 면책 고지 */}
      <div className="px-5 pb-6 pt-2">
        <p className="text-[11px] leading-relaxed text-toss-text-tertiary">
          이 정보는 투자 판단 참고용이며 매수 추천이 아닙니다. 실제 매매는 신한투자증권 MTS에서 본인 판단으로 진행하세요.
        </p>
      </div>

      <ActionBar isWatching={watching} onToggleWatch={handleToggleWatch} />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-toss-text-tertiary">{label}</p>
      <p className="text-[14px] font-semibold text-toss-text-primary mt-0.5">{value}</p>
    </div>
  );
}
