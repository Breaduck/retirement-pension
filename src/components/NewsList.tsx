import type { NewsItem } from "@/lib/data";

export default function NewsList({ items }: { items: NewsItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="card p-4 text-[12px] text-toss-text-tertiary">
        관련 뉴스가 아직 수집되지 않았어요.
      </div>
    );
  }
  return (
    <div className="card p-4">
      <div className="text-[14px] font-semibold mb-2">관련 뉴스</div>
      <ul className="divide-y divide-toss-divider">
        {items.map((n, i) => (
          <li key={i} className="py-2.5 first:pt-0 last:pb-0">
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="text-[13px] text-toss-text-primary font-medium leading-snug group-hover:text-toss-blue line-clamp-2">
                {n.title}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-toss-text-tertiary">
                <span>{n.publisher}</span>
                <span>·</span>
                <span className="tabular-nums">{relTime(n.published_at)}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function relTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd}일 전`;
  return d.toISOString().slice(0, 10);
}
