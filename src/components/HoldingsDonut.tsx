import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Holding } from "@/lib/data";

const COLORS = [
  "#3182F6",
  "#0EBD8C",
  "#FFA800",
  "#F04452",
  "#8B5CF6",
  "#0EA5E9",
  "#EC4899",
  "#84CC16",
  "#F97316",
  "#64748B",
  "#94A3B8",
];

export default function HoldingsDonut({
  holdings,
  asOf,
}: {
  holdings: Holding[];
  asOf?: string;
}) {
  const top = holdings.slice(0, 10);
  const others = holdings.slice(10);
  const otherSum = others.reduce((s, h) => s + h.weight_pct, 0);

  const data = [
    ...top,
    ...(otherSum > 0
      ? [{ name: "기타", weight_pct: round(otherSum, 2) }]
      : []),
  ];

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[14px] font-semibold">보유 종목</div>
        {asOf && (
          <div className="text-[11px] text-toss-text-tertiary tabular-nums">
            기준 {asOf}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="weight_pct"
                nameKey="name"
                innerRadius={36}
                outerRadius={60}
                paddingAngle={1}
                isAnimationActive={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E8EB",
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, "비중"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-1.5 min-w-0">
          {data.slice(0, 8).map((h, i) => (
            <li
              key={(h as Holding).name}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate text-toss-text-secondary">
                  {(h as Holding).name}
                </span>
              </div>
              <span className="tabular-nums font-semibold">
                {(h as Holding).weight_pct.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function round(v: number, d: number) {
  const p = Math.pow(10, d);
  return Math.round(v * p) / p;
}
