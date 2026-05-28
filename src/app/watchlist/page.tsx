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
    <main className="pb-16 pt-4">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="mb-12 flex flex-col gap-6 border-b-2 border-black pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-foreground">
              Portfolio monitoring
            </p>
            <h1 className="mt-3 text-5xl font-extrabold text-foreground sm:text-6xl">
              Tracked Domain Signals
            </h1>
            <p className="mt-4 text-lg text-foreground">
              Monitor availability changes, expiry timelines, resale status, and registrar updates for all watched domains.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/analyze"
              className="btn-purple inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold"
            >
              Back to Analyzer
            </Link>
            <button
              onClick={handleRecheckAll}
              disabled={bulkLoading}
              className="btn-lime inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold disabled:opacity-70"
            >
              {bulkLoading ? "Rechecking..." : "Recheck All"}
            </button>
          </div>
        </div>

        <div className="mt-8">
          {items.length === 0 ? (
            <div className="border-2 border-black rounded-lg bg-card p-12 text-center">
              <h2 className="text-2xl font-bold text-foreground">No watched domains yet</h2>
              <p className="mt-3 text-base text-foreground">
                Add a domain from the analyzer to start tracking portfolio signals.
              </p>
              <Link
                href="/analyze"
                className="mt-6 btn-lime inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold"
              >
                Add first domain
              </Link>
            </div>
          ) : (
            <>
              {/* Table View */}
              <div className="border-2 border-black rounded-lg bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-black bg-accent-lime">
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-foreground">
                          Domain
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-foreground">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-foreground">
                          Score
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-foreground">
                          Value
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-foreground">
                          Expires
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-foreground">
                          Registrar
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr
                          key={it.domain}
                          className={`border-b-2 border-black ${idx % 2 === 0 ? "bg-background" : "bg-card"}`}
                        >
                          <td className="px-6 py-4 text-sm font-mono-data font-bold text-foreground">
                            {it.domain}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold">
                            <span
                              className={`inline-block border-2 border-black rounded-lg px-3 py-1 ${
                                it.availabilityStatus === "Available"
                                  ? "bg-accent-lime text-foreground"
                                  : "bg-background text-foreground"
                              }`}
                            >
                              {it.availabilityStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono-data font-bold text-accent-lime">
                            {it.score}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono-data font-bold text-foreground">
                            {it.estimatedValueUsd ? `$${it.estimatedValueUsd.toLocaleString()}` : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {formatDate(it.expiresAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {it.registrar ?? "-"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleRecheck(it.domain)}
                                disabled={!!loadingMap[it.domain]}
                                className="border-2 border-black bg-background rounded-lg px-3 py-2 text-xs font-bold text-foreground hover:bg-accent-lime transition-colors disabled:opacity-70"
                              >
                                {loadingMap[it.domain] ? "..." : "Recheck"}
                              </button>
                              <button
                                onClick={() => handleRemove(it.domain)}
                                className="border-2 border-black bg-background rounded-lg px-3 py-2 text-xs font-bold text-foreground hover:bg-background/80 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="border-t-2 border-black bg-background px-6 py-4 text-xs text-foreground/70">
                  <p>
                    {items.length} domain{items.length !== 1 ? "s" : ""} tracked · Last refreshed: {formatDate(new Date().toISOString())}
                  </p>
                </div>
              </div>

              {/* Detail Cards Below Table */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it) => (
                  <div key={it.domain} className="border-2 border-black rounded-lg bg-card p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground mb-2">
                      {it.domain}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between border-b border-black pb-2">
                        <span className="text-foreground/70">Resale Status</span>
                        <span className="font-semibold text-foreground">{it.resaleStatus ?? "-"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-black pb-2">
                        <span className="text-foreground/70">Added</span>
                        <span className="font-semibold text-foreground">{formatDate(it.addedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/70">Last Checked</span>
                        <span className="font-semibold text-foreground">{formatDate(it.lastCheckedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <section className="mt-10 border-2 border-black rounded-lg bg-card p-8">
          <h3 className="text-xl font-bold text-foreground">Future automatic alerts</h3>
          <p className="mt-3 text-foreground">
            Automatic monitoring is planned. In production, a scheduled job will check watched domains daily and send notifications when availability, expiry, or resale status changes.
          </p>
          <div className="mt-4 border-2 border-black rounded-lg bg-background px-4 py-3 text-sm text-foreground font-mono-data">
            <p>Scheduled architecture → watchlist in DB → cron daily → RDAP/marketplace checks → send email on changes</p>
          </div>
        </section>
      </div>
    </main>
  );
}
