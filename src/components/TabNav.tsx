export type TabKey = "realtime" | "category" | "risk";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "realtime", label: "실시간 순위" },
  { key: "category", label: "카테고리별" },
  { key: "risk",     label: "위험등급별" },
];

export default function TabNav({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <div className="tab-nav">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`tab-item${value === t.key ? " active" : ""}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
