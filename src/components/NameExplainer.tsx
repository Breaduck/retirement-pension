import type { ProductSummary } from "@/lib/data";

export default function NameExplainer({ p }: { p: ProductSummary }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] text-toss-text-tertiary uppercase tracking-wider mb-1">
        이 상품은 한 줄로
      </div>
      <div className="text-[16px] leading-snug font-semibold text-toss-text-primary">
        {p.nickname ?? p.name}
      </div>
      {p.one_line && (
        <p className="mt-2 text-[13px] text-toss-text-secondary leading-relaxed">
          {p.one_line}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-[12px]">
        <Label>정식 이름</Label>
        <Val>{p.name}</Val>
        {p.asset_manager && (
          <>
            <Label>운용사</Label>
            <Val>{p.asset_manager}</Val>
          </>
        )}
        {p.benchmark && (
          <>
            <Label>추종 지수</Label>
            <Val>{p.benchmark}</Val>
          </>
        )}
        {p.ticker && (
          <>
            <Label>티커</Label>
            <Val className="tabular-nums">{p.ticker}</Val>
          </>
        )}
      </div>
      {p.benchmark_explainer && (
        <p className="mt-3 text-[12px] text-toss-text-secondary bg-toss-bg rounded-lg p-3 leading-relaxed">
          <span className="font-semibold text-toss-text-primary">
            추종 지수란 ?
          </span>{" "}
          {p.benchmark_explainer}
        </p>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-toss-text-tertiary">{children}</span>;
}
function Val({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={"text-toss-text-primary font-medium " + (className ?? "")}>
      {children}
    </span>
  );
}
