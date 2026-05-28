export type WatchItem = {
  domain: string;
  score: number;
  availabilityStatus: string;
  resaleStatus?: string | null;
  estimatedValueUsd?: number | null;
  registrar?: string | null;
  expiresAt?: string | null;
  addedAt: string;
  lastCheckedAt: string;
};

const STORAGE_KEY = "domain-flip.watchlist";

export function getWatchlist(): WatchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WatchItem[];
  } catch (e) {
    console.error("Failed to read watchlist", e);
    return [];
  }
}

export function saveWatchlist(items: WatchItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save watchlist", e);
  }
}

export function addToWatchlist(item: Omit<WatchItem, "addedAt" | "lastCheckedAt">) {
  const list = getWatchlist();
  const exists = list.find((i) => i.domain.toLowerCase() === item.domain.toLowerCase());
  if (exists) return false;
  const now = new Date().toISOString();
  const toSave: WatchItem = {
    ...item,
    addedAt: now,
    lastCheckedAt: now,
  };
  list.unshift(toSave);
  saveWatchlist(list);
  return true;
}

export function removeFromWatchlist(domain: string) {
  const list = getWatchlist();
  const filtered = list.filter((i) => i.domain.toLowerCase() !== domain.toLowerCase());
  saveWatchlist(filtered);
}

export function updateWatchlistItem(domain: string, patch: Partial<WatchItem>) {
  const list = getWatchlist();
  const idx = list.findIndex((i) => i.domain.toLowerCase() === domain.toLowerCase());
  if (idx === -1) return false;
  const updated = { ...list[idx], ...patch } as WatchItem;
  list[idx] = updated;
  saveWatchlist(list);
  return true;
}

export async function recheckDomain(domain: string) {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    if (!res.ok) throw new Error("Recheck failed");
    const json = await res.json();
    return json;
  } catch (e) {
    console.error("Recheck failed", e);
    throw e;
  }
}
