"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  listWatchedDomainsRef,
  removeWatchedDomainRef,
  updateWatchedDomainRef,
} from "@/lib/convex";
import { recheckDomain } from "@/lib/watchlist";
import type { WatchItem } from "@/lib/watchlist";

function formatDate(d?: string | null) {
  if (!d) return "-";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(d));
  } catch {
    return d;
  }
}

function formatCurrency(value?: number | null) {
  if (!value && value !== 0) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function Stat({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="panel-white-soft rounded-[22px] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-black">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtext}</p>
    </div>
  );
}

export default function WatchlistPage() {
  const watchedDomains = useQuery(listWatchedDomainsRef) as WatchItem[] | undefined;
  const items = watchedDomains ?? [];
  const isInitialLoading = watchedDomains === undefined;
  const removeWatchedDomain = useMutation(removeWatchedDomainRef);
  const updateWatchedDomain = useMutation(updateWatchedDomainRef);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);

  async function handleRemove(domain: string) {
    await removeWatchedDomain({ domain });
  }

  async function handleRecheck(domain: string) {
    setLoadingMap((m) => ({ ...m, [domain]: true }));
    try {
      const res = await recheckDomain(domain);
      await updateWatchedDomain({
        domain,
        score: res.score,
        availabilityStatus: res.availabilityStatus,
        resaleStatus: res.resaleStatus ?? res.marketplaceStatus ?? res.availabilityStatus,
        estimatedValueUsd: res.adjustedEstimatedValueUsd ?? res.estimatedValueUsd ?? null,
        registrar: res.rdap?.registrar ?? null,
        expiresAt: res.rdap?.expiresAt ?? null,
        lastCheckedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMap((m) => ({ ...m, [domain]: false }));
    }
  }

  async function handleRecheckAll() {
    setBulkLoading(true);
    for (const it of items) {
      try {
        const res = await recheckDomain(it.domain);
        await updateWatchedDomain({
          domain: it.domain,
          score: res.score,
          availabilityStatus: res.availabilityStatus,
          resaleStatus: res.resaleStatus ?? res.marketplaceStatus ?? res.availabilityStatus,
          estimatedValueUsd: res.adjustedEstimatedValueUsd ?? res.estimatedValueUsd ?? null,
          registrar: res.rdap?.registrar ?? null,
          expiresAt: res.rdap?.expiresAt ?? null,
          lastCheckedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error(e);
      }
    }
    setBulkLoading(false);
  }

  const totalEstimatedValue = items.reduce((sum, item) => sum + (item.estimatedValueUsd ?? 0), 0);
  const averageScore = items.length
    ? Math.round(items.reduce((sum, item) => sum + (item.score ?? 0), 0) / items.length)
    : 0;
  const takenCount = items.filter((item) => item.availabilityStatus === "Taken").length;

  return (
    <main className="pb-16">
      <section className="relative overflow-hidden rounded-[32px] border border-black bg-[#0b0d12] px-6 py-8 text-white sm:px-8 lg:px-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
              Portfolio monitoring desk
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Track domains like an active pipeline, not a bookmark list.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
              Recheck expiry timing, value drift, resale posture, and registrar metadata across monitored names from one workspace.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-[#101726] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tracked domains</p>
                <p className="data-mono mt-3 text-3xl font-semibold text-white">{items.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Current watchlist entries.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-[#101726] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Taken domains</p>
                <p className="data-mono mt-3 text-3xl font-semibold text-white">{takenCount}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Candidates requiring monitoring or outreach.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-[#101726] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Portfolio estimate</p>
                <p className="data-mono mt-3 text-3xl font-semibold text-white">{formatCurrency(totalEstimatedValue)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Combined adjusted estimate across tracked names.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#111318] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
            <div className="border-b border-white/10 pb-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Actions</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Watchlist controls</h2>
            </div>
            <div className="mt-5 grid gap-3">
              <button
                onClick={handleRecheckAll}
                disabled={bulkLoading || items.length === 0}
                className="btn-lime inline-flex min-h-[52px] items-center justify-center rounded-full text-sm font-semibold disabled:opacity-60"
              >
                {bulkLoading ? "Rechecking..." : "Recheck All"}
              </button>
              <Link
                href="/analyze"
                className="btn-ghost inline-flex min-h-[52px] items-center justify-center rounded-full text-sm font-semibold"
              >
                Analyze New Domain
              </Link>
            </div>
            <div className="mt-6 rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Portfolio pulse</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Average score</span>
                  <span className="data-mono text-white">{averageScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last action</span>
                  <span className="text-white">{bulkLoading ? "Batch recheck in progress" : "Ready"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monitoring posture</span>
                  <span className="text-white">{items.length ? "Active" : "Empty"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isInitialLoading ? (
        <section className="mt-10 grid-paper rounded-[30px] border border-black p-4 sm:p-6">
          <div className="panel-white rounded-[28px] p-10 text-center">
            <h2 className="text-2xl font-semibold text-black">Loading watchlist</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-700">
              Fetching your saved domains from Convex.
            </p>
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="mt-10 grid-paper rounded-[30px] border border-black p-4 sm:p-6">
          <div className="panel-white rounded-[28px] p-10 text-center">
            <h2 className="text-2xl font-semibold text-black">No watched domains yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-700">
              Add a domain from the analyzer to begin tracking availability, value, and registrar movement in this monitoring workspace.
            </p>
            <div className="mt-6">
              <Link href="/analyze" className="btn-lime inline-flex rounded-full px-6 py-3 text-sm font-semibold">
                Start With Analysis
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-10 grid-paper rounded-[30px] border border-black p-4 sm:p-6">
            <div className="panel-white rounded-[28px] p-6 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-black pb-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">Watchlist Intelligence</p>
                  <h2 className="mt-2 text-3xl font-semibold text-black">Active domain portfolio</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                    Use this table to monitor acquisition timing, score drift, expiry windows, and estimated value across your shortlist.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
                  <Stat label="Tracked" value={`${items.length}`} subtext="Domains in this workspace" />
                  <Stat label="Average Score" value={`${averageScore}`} subtext="Current screening average" />
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-black text-xs uppercase tracking-[0.18em] text-slate-600">
                      <th className="px-3 py-3 font-medium">Domain</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Expiry</th>
                      <th className="px-3 py-3 font-medium">Estimated Value</th>
                      <th className="px-3 py-3 font-medium">Score</th>
                      <th className="px-3 py-3 font-medium">Last Checked</th>
                      <th className="px-3 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.domain} className="border-b border-black/10 align-top last:border-b-0">
                        <td className="px-3 py-4">
                          <div className="data-mono text-sm font-semibold text-black">{it.domain}</div>
                          <div className="mt-1 text-xs text-slate-500">Registrar: {it.registrar ?? "-"}</div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="inline-flex rounded-full border border-black bg-white px-3 py-1 text-xs font-semibold text-black">
                            {it.availabilityStatus}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">{it.resaleStatus ?? "-"}</div>
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-700">{formatDate(it.expiresAt)}</td>
                        <td className="data-mono px-3 py-4 text-sm text-slate-700">{formatCurrency(it.estimatedValueUsd)}</td>
                        <td className="data-mono px-3 py-4 text-sm text-slate-700">{it.score ?? "-"}</td>
                        <td className="px-3 py-4 text-sm text-slate-600">{formatDate(it.lastCheckedAt)}</td>
                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleRecheck(it.domain)}
                              disabled={!!loadingMap[it.domain]}
                              className="btn-ghost rounded-full px-3 py-2 text-sm font-semibold disabled:opacity-50"
                            >
                              {loadingMap[it.domain] ? "Checking..." : "Recheck"}
                            </button>
                            <button
                              onClick={() => handleRemove(it.domain)}
                              className="rounded-full border border-black bg-white px-3 py-2 text-sm font-semibold text-black"
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
            </div>
          </section>

          <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="panel-white rounded-[28px] p-6 sm:p-7">
              <div className="border-b border-black pb-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">Monitoring Notes</p>
                <h3 className="mt-2 text-2xl font-semibold text-black">How to use this queue</h3>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="panel-white-soft rounded-[22px] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Availability</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">Taken domains belong here when you want expiry visibility or ownership timing.</p>
                </div>
                <div className="panel-white-soft rounded-[22px] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Valuation drift</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">Rechecks refresh adjusted value, market posture, and benchmark alignment.</p>
                </div>
                <div className="panel-white-soft rounded-[22px] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Action timing</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">Use expiry dates and score stability to decide whether to monitor, inquire, or drop a candidate.</p>
                </div>
              </div>
            </div>

            <div className="panel-white rounded-[28px] p-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">Monitoring Roadmap</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <p>Automatic alerts are planned for RDAP changes, resale posture shifts, expiry timing, and benchmark value movement.</p>
                <p>For now, manual rechecks keep the watchlist current while the product flow remains visible.</p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
