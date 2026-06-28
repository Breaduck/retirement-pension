const KEY = "retirement_watchlist";

export function getWatchlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addToWatchlist(id: string): void {
  const list = getWatchlist();
  if (!list.includes(id)) {
    localStorage.setItem(KEY, JSON.stringify([...list, id]));
  }
}

export function removeFromWatchlist(id: string): void {
  const list = getWatchlist().filter((x) => x !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isInWatchlist(id: string): boolean {
  return getWatchlist().includes(id);
}

export function toggleWatchlist(id: string): boolean {
  if (isInWatchlist(id)) {
    removeFromWatchlist(id);
    return false;
  }
  addToWatchlist(id);
  return true;
}
