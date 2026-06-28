import { useLocation, useNavigate } from "react-router-dom";

const ITEMS = [
  {
    label: "내 연금",
    path:  "/me",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-7" />
      </svg>
    ),
  },
  {
    label: "관심",
    path:  "/watch",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21s-7-4.35-9.5-9.5C1 8 3.5 4 7.5 4c2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4 20.5 4 23 8 21.5 11.5 19 16.65 12 21 12 21z" />
      </svg>
    ),
  },
  {
    label: "최근 본",
    path:  "/recent",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    label: "실시간",
    path:  "/realtime",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    ),
  },
];

export default function IconRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="icon-rail">
      <button
        className="icon-rail-item"
        title="접기"
        onClick={() => {}}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 6l6 6-6 6" />
          <path d="M5 6l6 6-6 6" />
        </svg>
      </button>
      {ITEMS.map((it) => {
        const active = pathname === it.path;
        return (
          <button
            key={it.path}
            onClick={() => navigate(it.path)}
            className={`icon-rail-item${active ? " active" : ""}`}
          >
            {it.icon}
            <span className="icon-rail-label">{it.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
