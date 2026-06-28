export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatKRW(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  if (value >= 1_0000_0000_0000) return `${(value / 1_0000_0000_0000).toFixed(1)}조`;
  if (value >= 1_0000_0000) return `${(value / 1_0000_0000).toFixed(0)}억`;
  if (value >= 1_0000) return `${(value / 1_0000).toFixed(0)}만`;
  return value.toLocaleString();
}

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return value.toLocaleString();
}

export function colorForChange(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "text-toss-text-tertiary";
  if (value > 0) return "text-toss-red";
  if (value < 0) return "text-toss-blue";
  return "text-toss-text-secondary";
}
