import Sparkline from "./Sparkline";
import { formatPercent, colorForChange } from "@/lib/format";

type Variant = "big" | "medium" | "text";

type Props = {
  variant:    Variant;
  title:      string;
  value:      number | null;
  delta?:     number | null;
  sparkPoints?: number[];
  hi?:        number | null;
  lo?:        number | null;
  caption?:   string;
};

function valueColor(v: number | null | undefined) {
  if (v == null) return "text-toss-text-tertiary";
  if (v > 0) return "text-toss-red";
  if (v < 0) return "text-[#2468F6]";
  return "text-toss-text-primary";
}

function strokeColor(v: number | null | undefined) {
  if (v == null) return "#8B95A1";
  if (v >= 0) return "#F04452";
  return "#3182F6";
}

export default function CategoryStatCard({
  variant,
  title,
  value,
  delta,
  sparkPoints = [],
  hi,
  lo,
  caption,
}: Props) {
  const numClass = "tabular-nums font-bold tracking-tight";

  if (variant === "big") {
    return (
      <div className="market-card-big">
        <div className="market-card-title">{title}</div>
        <div className={`market-card-num ${valueColor(value)}`}>
          {value != null ? formatPercent(value, 2) : "—"}
        </div>
        {delta != null && (
          <div className={`market-card-delta ${colorForChange(delta)}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}%
          </div>
        )}
        <div className="mt-2">
          <Sparkline
            points={sparkPoints}
            color={strokeColor(value)}
            width={240}
            height={70}
            strokeWidth={2}
            fill
          />
        </div>
        {(hi != null || lo != null) && (
          <div className="flex gap-6 mt-2 text-[12px] text-toss-text-tertiary">
            {hi != null && (
              <div>
                최고 <span className={`ml-1 ${numClass} text-toss-text-secondary`}>{formatPercent(hi, 1)}</span>
              </div>
            )}
            {lo != null && (
              <div>
                최저 <span className={`ml-1 ${numClass} text-toss-text-secondary`}>{formatPercent(lo, 1)}</span>
              </div>
            )}
          </div>
        )}
        {caption && (
          <div className="text-[12px] text-toss-text-tertiary mt-1">{caption}</div>
        )}
      </div>
    );
  }

  if (variant === "medium") {
    return (
      <div className="market-card">
        <div className="market-card-title">{title}</div>
        <div className={`market-card-num ${valueColor(value)}`}>
          {value != null ? formatPercent(value, 2) : "—"}
        </div>
        {delta != null && (
          <div className={`market-card-delta ${colorForChange(delta)}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}%
          </div>
        )}
        <div className="mt-1">
          <Sparkline
            points={sparkPoints}
            color={strokeColor(value)}
            width={150}
            height={36}
            strokeWidth={1.5}
          />
        </div>
      </div>
    );
  }

  // text variant
  return (
    <div className="market-card-text">
      <div>
        <div className="market-card-title">{title}</div>
        <div className={`market-card-num mt-1 ${valueColor(value)}`}>
          {value != null ? formatPercent(value, 2) : "—"}
        </div>
      </div>
      <div className="text-[12px] text-toss-text-tertiary hover:text-toss-blue cursor-pointer">
        {caption ?? "실시간 보기"}
        <span className="ml-1">›</span>
      </div>
    </div>
  );
}
