import { useRef } from "react";
import { CATEGORY_LABEL, Category } from "../lib/data";

const ALL_CATEGORIES: Array<{ value: Category | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "us_stock", label: "미국주식" },
  { value: "kr_stock", label: "한국주식" },
  { value: "global_stock", label: "글로벌주식" },
  { value: "bond", label: "채권" },
  { value: "tdf", label: "TDF" },
  { value: "reit_infra", label: "리츠/인프라" },
  { value: "commodity", label: "원자재" },
  { value: "principal_guaranteed", label: "원금보장" },
];

interface Props {
  selected: Category | "all";
  onChange: (v: Category | "all") => void;
}

export default function CategoryChips({ selected, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-none"
      style={{ scrollbarWidth: "none" }}
    >
      {ALL_CATEGORIES.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value as Category | "all")}
          className={`chip${selected === c.value ? " active" : ""}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export { ALL_CATEGORIES, CATEGORY_LABEL };
