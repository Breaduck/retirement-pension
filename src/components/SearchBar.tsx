import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loadProducts, ProductSummary, CATEGORY_LABEL } from "../lib/data";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts().then((pf) => setProducts(pf.products));
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = q.trim()
    ? products
        .filter((p) => (p.name + " " + (p.nickname ?? "")).toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8)
    : [];

  const handlePick = (id: string) => {
    setOpen(false);
    setQ("");
    navigate(`/s/${id}`);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="search-bar">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-toss-text-tertiary" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          className="search-input"
          placeholder="종목명으로 검색"
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        />
      </div>

      {open && q && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-toss-border rounded-2xl shadow-xl py-2 max-h-[400px] overflow-y-auto z-50">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePick(p.id)}
              className="w-full text-left px-4 py-3 hover:bg-toss-divider transition-colors"
            >
              <p className="text-[14px] font-semibold text-toss-text-primary truncate">
                {p.nickname || p.name}
              </p>
              <p className="text-[12px] text-toss-text-tertiary mt-0.5">
                {CATEGORY_LABEL[p.category]}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
