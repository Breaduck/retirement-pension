import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface Point {
  year: number;
  stock_pct: number;
  bond_pct: number;
}

export default function GlidePathChart({
  series,
  targetYear,
}: {
  series: Point[];
  targetYear: number;
}) {
  if (!series || series.length === 0) return null;
  return (
    <div className="card p-4">
      <div className="text-[14px] font-semibold mb-1">글라이드패스</div>
      <p className="text-[11px] text-toss-text-tertiary mb-2 leading-relaxed">
        은퇴 시점({targetYear}년)에 가까워질수록 주식 비중을 줄이고 채권 비중을
        늘리는 자동 자산배분 경로입니다.
      </p>
      <div className="h-44">
        <ResponsiveContainer>
          <AreaChart
            data={series}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: "#8B95A1" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#8B95A1" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E5E8EB",
                fontSize: 12,
              }}
              formatter={(v: number, n) => [`${v}%`, n === "stock_pct" ? "주식" : "채권"]}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v) => (v === "stock_pct" ? "주식" : "채권")}
            />
            <Area
              type="monotone"
              dataKey="stock_pct"
              stackId="1"
              stroke="#3182F6"
              fill="#3182F6"
              fillOpacity={0.7}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="bond_pct"
              stackId="1"
              stroke="#0EBD8C"
              fill="#0EBD8C"
              fillOpacity={0.7}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
