import type { ProductSummary, TimingSignal } from "@/lib/data";

const SIGNAL: Record<TimingSignal["signal"], {
  big: string;
  sub: string;
  bg: string;
  text: string;
  ring: string;
}> = {
  green: {
    big: "지금 사도 괜찮아요",
    sub: "가격대·추세·변동성이 매수에 우호적",
    bg: "bg-toss-green",
    text: "text-toss-green",
    ring: "ring-toss-green/20",
  },
  yellow: {
    big: "지금은 조금 비싸요",
    sub: "한번에 사지 말고 3~6개월 나눠서",
    bg: "bg-toss-yellow",
    text: "text-toss-yellow",
    ring: "ring-toss-yellow/20",
  },
  red: {
    big: "기다리는 게 나아요",
    sub: "현재 위험·가격 모두 부담스러운 구간",
    bg: "bg-toss-red",
    text: "text-toss-red",
    ring: "ring-toss-red/20",
  },
};

export default function DecisionHero({ p }: { p: ProductSummary }) {
  if (!p.timing) return null;
  const s = SIGNAL[p.timing.signal];

  return (
    <div className={"card p-5 ring-8 " + s.ring}>
      {/* 큰 한 줄 결론 */}
      <div className="flex items-center gap-3">
        <div className={"w-3 h-3 rounded-full " + s.bg} />
        <div className={"text-[11px] font-bold tracking-wider uppercase " + s.text}>
          오늘의 판단
        </div>
      </div>
      <div className="text-[26px] font-extrabold leading-tight mt-1 text-toss-text-primary">
        {s.big}
      </div>
      <div className="text-[13px] text-toss-text-secondary mt-1">{s.sub}</div>

      {/* 점수바 */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-toss-text-tertiary mb-1">
          <span>위험</span>
          <span className="tabular-nums font-bold text-toss-text-primary">
            {p.timing.score}/100
          </span>
          <span>매수</span>
        </div>
        <div className="h-2 rounded-full bg-toss-divider overflow-hidden relative">
          <div
            className={"h-full " + s.bg}
            style={{ width: `${p.timing.score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
