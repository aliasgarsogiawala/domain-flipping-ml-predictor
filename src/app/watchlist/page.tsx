"use client";

import { useState } from "react";
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
  const [items, setItems] = useState<WatchItem[]>(() => getWatchlist());
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);

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
    <main className="pb-16">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Portfolio monitoring
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Domain watchlist</h1>
            <p className="mt-2 text-sm text-slate-600">
              Track taken domains, refresh status, and keep expiry or registrar changes visible.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/analyze"
              className="secondary-button inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
            >
              Back to Analyzer
            </Link>
            <button
              onClick={handleRecheckAll}
              disabled={bulkLoading}
              className="accent-button inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {bulkLoading ? "Rechecking..." : "Recheck all"}
            </button>
          </div>
        </div>

        <div className="mt-8">
          {items.length === 0 ? (
            <div className="surface-strong rounded-3xl p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-950">No watched domains yet</h2>
              <p className="mt-2 text-sm text-slate-600">
                Add a domain from the analyzer to start tracking it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((it) => (
                <div key={it.domain} className="surface-strong rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{it.domain}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">Score: {it.score}</p>
                      <p className="mt-2 text-sm text-slate-600">Registrar: {it.registrar ?? "-"}</p>
                      <p className="mt-1 text-sm text-slate-600">Expires: {formatDate(it.expiresAt)}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-sm text-slate-700">Status: {it.availabilityStatus}</div>
                      <div className="text-sm text-slate-700">Resale: {it.resaleStatus ?? "-"}</div>
                      <div className="text-sm text-slate-700">
                        Value: {it.estimatedValueUsd ? `$${it.estimatedValueUsd.toLocaleString()}` : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => handleRecheck(it.domain)}
                      disabled={!!loadingMap[it.domain]}
                      className="secondary-button rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {loadingMap[it.domain] ? "Checking..." : "Recheck status"}
                    </button>
                    <button
                      onClick={() => handleRemove(it.domain)}
                      className="rounded-xl border border-[#fecaca] bg-[#fef3f2] px-3 py-2 text-sm font-medium text-[#b42318]"
                    >
                      Remove
                    </button>
                    <div className="ml-auto text-xs text-slate-500">
                      Added: {formatDate(it.addedAt)} · Last checked: {formatDate(it.lastCheckedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <section className="surface rounded-3xl p-5 mt-8">
          <h3 className="text-sm font-semibold text-slate-900">Future automatic alerts</h3>
          <p className="mt-2 text-sm text-slate-600">
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
