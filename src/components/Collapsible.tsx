import { useState, type ReactNode } from "react";

export default function Collapsible({
  title,
  hint,
  children,
  defaultOpen = false,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-toss-divider/30"
      >
        <div className="text-left">
          <div className="text-[14px] font-semibold text-toss-text-primary">
            {title}
          </div>
          {hint && (
            <div className="text-[11px] text-toss-text-tertiary mt-0.5">{hint}</div>
          )}
        </div>
        <svg
          className={
            "w-5 h-5 text-toss-text-tertiary transition-transform " +
            (open ? "rotate-180" : "")
          }
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-toss-divider">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}
