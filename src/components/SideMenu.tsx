import { Category, CATEGORY_LABEL } from "../lib/data";

interface Props {
  selected: Category | "all";
  onChange: (c: Category | "all") => void;
}

const ORDER: Array<Category | "all"> = [
  "all",
  "us_stock",
  "kr_stock",
  "global_stock",
  "tdf",
  "bond",
  "reit_infra",
  "commodity",
  "principal_guaranteed",
];

export default function SideMenu({ selected, onChange }: Props) {
  return (
    <aside className="side-menu w-full">
      <p className="side-menu-section">카테고리</p>
      {ORDER.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`side-menu-item w-full text-left${selected === c ? " active" : ""}`}
        >
          <span className="flex-1">{c === "all" ? "전체 상품" : CATEGORY_LABEL[c as Category]}</span>
        </button>
      ))}
    </aside>
  );
}
