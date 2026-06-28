import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { PricePoint, IntradayPoint } from "@/lib/data";

const RANGES = [
  { key: "1D", label: "1일", days: 1 },
  { key: "1W", label: "1주", days: 5 },
  { key: "3M", label: "3개월", days: 66 },
  { key: "1Y", label: "1년", days: 252 },
  { key: "5Y", label: "5년", days: 252 * 5 },
  { key: "ALL", label: "전체", days: Infinity },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

interface Props {
  series: PricePoint[];
  intraday?: IntradayPoint[];
}

export default function PriceChart({ series, intraday }: Props) {
  const [range, setRange] = useState<RangeKey>("1Y");

  const data = useMemo(() => {
    if (range === "1D") {
      if (intraday && intraday.length > 0)
        return intraday.map((p) => ({ x: p.time, y: p.price }));
      // intraday 없으면 최근 5거래일로 폴백
      return series.slice(-5).map((p) => ({ x: p.date, y: p.close }));
    }
    if (!series || series.length === 0) return [];
    const r = RANGES.find((x) => x.key === range)!;
    const start = Math.max(0, series.length - r.days);
    return series.slice(start).map((p) => ({ x: p.date, y: p.close }));
  }, [series, intraday, range]);

  const change = useMemo(() => {
    if (data.length < 2) return 0;
    const first = data[0].y;
    const last = data[data.length - 1].y;
    return ((last - first) / first) * 100;
  }, [data]);

  const color = change >= 0 ? "#F04452" : "#3182F6";
  const isIntraday = range === "1D" && intraday && intraday.length > 0;

  return (
    <div className="card p-4">
      {/* 헤더: 큰 변화율 */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[11px] text-toss-text-tertiary">
            {RANGES.find((r) => r.key === range)?.label} 변화
          </div>
          <div
            className="text-[24px] font-extrabold tabular-nums leading-none mt-0.5"
            style={{ color }}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}%
          </div>
        </div>
        {data.length > 0 && (
          <div className="text-right">
            <div className="text-[11px] text-toss-text-tertiary">현재</div>
            <div className="text-[15px] font-bold tabular-nums tabular-nums">
              {data[data.length - 1].y.toLocaleString()}
              <span className="text-[11px] text-toss-text-tertiary font-medium ml-0.5">
                원
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 차트 */}
      <div className="h-52 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          {isIntraday ? (
            <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <XAxis dataKey="x" hide />
              <YAxis domain={["auto", "auto"]} hide />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E8EB",
                  fontSize: 12,
                }}
                formatter={(v: number) => [v.toLocaleString(), "가격"]}
                labelFormatter={(l) => l as string}
              />
              <Line
                type="monotone"
                dataKey="y"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="x" hide />
              <YAxis domain={["auto", "auto"]} hide />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E8EB",
                  fontSize: 12,
                }}
                formatter={(v: number) => [v.toLocaleString(), "종가"]}
                labelFormatter={(l) => l as string}
              />
              <Area
                type="monotone"
                dataKey="y"
                stroke={color}
                strokeWidth={2}
                fill="url(#priceFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 탭 */}
      <div className="flex justify-between mt-3 gap-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={
              "flex-1 text-[12px] py-1.5 rounded-lg font-semibold transition " +
              (range === r.key
                ? "bg-toss-text-primary text-white"
                : "text-toss-text-secondary hover:bg-toss-divider")
            }
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
