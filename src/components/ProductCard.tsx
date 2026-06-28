import { Link } from "react-router-dom";
import type { ProductSummary, SignalColor } from "@/lib/data";
import { CATEGORY_LABEL } from "@/lib/data";
import { formatPercent, colorForChange } from "@/lib/format";

const SIGNAL_DOT: Record<SignalColor, string> = {
  green: "bg-toss-green",
  yellow: "bg-toss-yellow",
  red: "bg-toss-red",
};
const SIGNAL_LABEL: Record<SignalColor, string> = {
  green: "사도 좋음",
  yellow: "분할 매수",
  red: "기다리기",
};

export default function ProductCard({ p }: { p: ProductSummary }) {
  return (
    <Link
      to={`/p/${encodeURIComponent(p.id)}`}
      className="card p-4 flex flex-col gap-3 hover:bg-toss-divider/30 active:bg-toss-divider/60 transition"
    >
      {/* 상단: 신호 + 카테고리 */}
      <div className="flex items-center justify-between gap-2">
        {p.timing ? (
          <div className="flex items-center gap-2">
            <span className={"w-2 h-2 rounded-full " + SIGNAL_DOT[p.timing.signal]} />
            <span
              className={
                "text-[11px] font-bold " +
                (p.timing.signal === "green"
                  ? "text-toss-green"
                  : p.timing.signal === "yellow"
                  ? "text-toss-yellow"
                  : "text-toss-red")
              }
            >
              {SIGNAL_LABEL[p.timing.signal]}
            </span>
          </div>
        ) : (
          <span />
        )}
        <span className="text-[10px] font-medium text-toss-text-tertiary bg-toss-divider/60 rounded-full px-2 py-0.5">
          {CATEGORY_LABEL[p.category]}
        </span>
      </div>

      {/* 중단: 닉네임 + 정식명 */}
      <div>
        <div className="text-[15px] font-bold text-toss-text-primary leading-snug line-clamp-2">
          {p.nickname ?? p.name}
        </div>
        <div className="text-[11px] text-toss-text-tertiary mt-0.5 line-clamp-1">
          {p.name}
        </div>
      </div>

      {/* 하단: 큰 1년 수익률 + 위험 */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] text-toss-text-tertiary">1년 수익률</div>
          <div
            className={
              "text-[22px] font-extrabold tabular-nums leading-none " +
              colorForChange(p.return_1y)
            }
          >
            {formatPercent(p.return_1y, 1)}
          </div>
        </div>
        <div className="text-right">
          {p.mdd_3y_pct !== undefined && (
            <>
              <div className="text-[10px] text-toss-text-tertiary">최악 낙폭</div>
              <div className="text-[13px] font-bold tabular-nums text-toss-blue">
                {p.mdd_3y_pct.toFixed(0)}%
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
