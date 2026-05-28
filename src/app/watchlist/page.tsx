"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWatchlist, removeFromWatchlist, recheckDomain, updateWatchlistItem } from "@/lib/watchlist";
import type { WatchItem } from "@/lib/watchlist";

function formatDate(d?: string | null) {
  if (!d) return "-";
  try {
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
  } catch {
    return d;
  }
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    setItems(getWatchlist());
  }, []);

  function refreshFromStorage() {
    setItems(getWatchlist());
  }

  async function handleRemove(domain: string) {
    removeFromWatchlist(domain);
    refreshFromStorage();
  }

  async function handleRecheck(domain: string) {
    setLoadingMap((m) => ({ ...m, [domain]: true }));
    try {
      const res = await recheckDomain(domain);
      updateWatchlistItem(domain, {
        score: res.score,
        availabilityStatus: res.availabilityStatus,
        resaleStatus: res.resaleStatus ?? res.marketplaceStatus ?? res.availabilityStatus,
        estimatedValueUsd: res.estimatedValueUsd ?? null,
        registrar: res.rdap?.registrar ?? null,
        expiresAt: res.rdap?.expiresAt ?? null,
        lastCheckedAt: new Date().toISOString(),
      });
      refreshFromStorage();
    } catch (e) {
      // keep existing data
      console.error(e);
    } finally {
      setLoadingMap((m) => ({ ...m, [domain]: false }));
    }
  }

  async function handleRecheckAll() {
    setBulkLoading(true);
    const list = getWatchlist();
    for (const it of list) {
      try {
        const res = await recheckDomain(it.domain);
        updateWatchlistItem(it.domain, {
          score: res.score,
          availabilityStatus: res.availabilityStatus,
          resaleStatus: res.resaleStatus ?? res.marketplaceStatus ?? res.availabilityStatus,
          estimatedValueUsd: res.estimatedValueUsd ?? null,
          registrar: res.rdap?.registrar ?? null,
          expiresAt: res.rdap?.expiresAt ?? null,
          lastCheckedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error(e);
      }
    }
    refreshFromStorage();
    setBulkLoading(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Domain Watchlist</h1>
            <p className="mt-2 text-sm text-slate-400">Track taken domains and recheck availability over time.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/analyze" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500">
              Back to Analyzer
            </Link>
            <button
              onClick={handleRecheckAll}
              disabled={bulkLoading}
              className="rounded-lg border border-cyan-600 bg-cyan-600/6 px-3 py-2 text-sm font-medium text-cyan-200 disabled:opacity-50"
            >
              {bulkLoading ? "Rechecking..." : "Recheck all"}
            </button>
          </div>
        </div>

        <div className="mt-8">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/10 p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-100">No watched domains yet</h2>
              <p className="mt-2 text-sm text-slate-400">Add a domain from the analyzer to start tracking it here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((it) => (
                <div key={it.domain} className="panel rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{it.domain}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">Score: {it.score}</p>
                      <p className="mt-2 text-sm text-slate-400">Registrar: {it.registrar ?? "-"}</p>
                      <p className="mt-1 text-sm text-slate-400">Expires: {formatDate(it.expiresAt)}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-sm text-slate-300">Status: {it.availabilityStatus}</div>
                      <div className="text-sm text-slate-300">Resale: {it.resaleStatus ?? "-"}</div>
                      <div className="text-sm text-slate-300">Value: {it.estimatedValueUsd ? `$${it.estimatedValueUsd.toLocaleString()}` : "-"}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => handleRecheck(it.domain)}
                      disabled={!!loadingMap[it.domain]}
                      className="rounded-xl border border-slate-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-slate-100 disabled:opacity-50"
                    >
                      {loadingMap[it.domain] ? "Checking..." : "Recheck status"}
                    </button>
                    <button
                      onClick={() => handleRemove(it.domain)}
                      className="rounded-xl border border-rose-700 px-3 py-2 text-sm font-medium text-rose-300"
                    >
                      Remove
                    </button>
                    <div className="ml-auto text-xs text-slate-400">Added: {formatDate(it.addedAt)} · Last checked: {formatDate(it.lastCheckedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <section className="mt-8 panel-subtle rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-200">Future automatic alerts</h3>
          <p className="mt-2 text-sm text-slate-400">
            Automatic alerts are planned. In production a scheduled job will check watched domains daily and notify users when availability, expiry, or resale status changes.
          </p>
          <div className="mt-3 text-xs text-slate-500">
            Scheduled architecture: watchlist in DB → cron daily → RDAP/marketplace checks → send email on changes.
          </div>
        </section>
      </div>
    </main>
  );
}
