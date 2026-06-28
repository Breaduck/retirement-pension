import type { ProductSummary } from "@/lib/data";
import { colorForChange } from "@/lib/format";

export default function PriceHero({ p }: { p: ProductSummary }) {
  const price = p.last_price;
  const change = p.daily_change_pct;
  return (
    <div className="px-2 pt-1">
      <div className="text-[12px] text-toss-text-tertiary">{p.nickname ?? p.name}</div>
      <div className="text-[13px] text-toss-text-secondary mt-0.5 line-clamp-1">
        {p.name}
      </div>
      <div className="flex items-baseline gap-3 mt-3">
        <div className="text-[36px] font-extrabold tabular-nums leading-none text-toss-text-primary">
          {price !== undefined ? price.toLocaleString() : "—"}
          <span className="text-[18px] text-toss-text-tertiary font-bold ml-1">원</span>
        </div>
      </div>
      <div className={"text-[14px] font-bold tabular-nums mt-1 " + colorForChange(change)}>
        {change !== undefined && change >= 0 ? "+" : ""}
        {change !== undefined ? `${change.toFixed(2)}%` : "—"} 오늘
      </div>
    </div>
  );
}
