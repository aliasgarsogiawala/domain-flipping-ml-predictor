"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import DomainComparisonChart from "@/components/DomainComparisonChart";
import ValueProjectionChart from "@/components/ValueProjectionChart";
import type { InvestmentReport } from "@/lib/investmentReport";
import type { MockMarketData } from "@/lib/mockMarketData";
import type { RdapLookupResult } from "@/lib/rdap";
import type { ValueProjectionResult } from "@/lib/valueProjection";
import { addToWatchlist } from "@/lib/watchlist";

type ApiResult = {
  domain: string;
  name: string;
  tld: string;
  score: number;
  investmentScore: number;
  brandPrestigeScore: number;
  ruleScore: number;
  marketScore: number;
  availabilityStatus: "Available" | "Taken" | "Unknown";
  estimatedValueUsd: number;
  tldMarketAnchorUsd: number;
  adjustedEstimatedValueUsd: number;
  liquidityScore: number;
  verdict: "Low Potential" | "Moderate Potential" | "High Potential" | "Premium Potential";
  riskLevel: "Low" | "Medium" | "High";
  reasons: string[];
  weaknesses: string[];
  marketData: MockMarketData;
  breakdown: Record<string, number>;
  comparableSalesCount: number;
  rdap: RdapLookupResult;
  marketplaceStatus?: string | null;
  marketplaceName?: string | null;
  askingPrice?: number | null;
  landingPageDetected?: boolean;
  marketplaceNotes?: string | null;
  resaleStatus?: "not_listed" | "listed_for_sale" | "possibly_listed" | "needs_verification" | "unknown";
  detectedMarketplace?: string | null;
  resaleConfidence?: "high" | "medium" | "low" | null;
  marketplaceLinks?: Record<string, string> | null;
  investmentReport: InvestmentReport;
  valueProjection: ValueProjectionResult;
};

const BREAKDOWN_LABELS: Record<string, string> = {
  tldStrength: "TLD Strength",
  length: "Length",
  brandability: "Brandability",
  memorability: "Memorability",
  pronounceability: "Pronounceability",
  premiumBrandSignal: "Brand Prestige",
  trendRelevance: "Trend Relevance",
  commercialIntent: "Commercial Intent",
  registrationHistory: "Registration History",
  riskPenalties: "Risk Penalties",
};

const BREAKDOWN_MAX: Record<string, number> = {
  tldStrength: 20,
  length: 20,
  brandability: 20,
  memorability: 15,
  pronounceability: 15,
  premiumBrandSignal: 20,
  trendRelevance: 15,
  commercialIntent: 15,
  registrationHistory: 10,
  riskPenalties: 20,
};

function formatDate(dateString: string | null) {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCurrency(value: number | null | undefined) {
  if (!value && value !== 0) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function titleCaseLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeForAvailability(value: ApiResult["availabilityStatus"]) {
  if (value === "Available") return "bg-[var(--lime)] text-black border-black";
  if (value === "Taken") return "bg-black text-white border-black";
  return "bg-white text-black border-black";
}

function badgeForRecommendation(value: InvestmentReport["recommendation"]) {
  if (value === "Buy") return "bg-[var(--lime)] text-black border-black";
  if (value === "Watch") return "bg-[var(--purple-bar)] text-black border-black";
  return "bg-white text-black border-black";
}

function badgeForRisk(value: ApiResult["riskLevel"]) {
  if (value === "Low") return "bg-[var(--lime)] text-black border-black";
  if (value === "Medium") return "bg-[#ffe8ae] text-black border-black";
  return "bg-[#ffd3d3] text-black border-black";
}

function StatCard({
  label,
  value,
  subtext,
  mono = false,
}: {
  label: string;
  value: string;
  subtext?: string;
  mono?: boolean;
}) {
  return (
    <div className="panel-white-soft rounded-[22px] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</p>
      <p className={`mt-3 text-2xl font-semibold text-black ${mono ? "data-mono" : ""}`}>{value}</p>
      {subtext ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtext}</p> : null}
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-black bg-white px-4 py-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`${mono ? "data-mono" : ""} text-right font-medium text-black`}>{value}</span>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="panel-white rounded-[28px] p-6 sm:p-7">
      <div className="flex flex-col gap-3 border-b border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-black">{title}</h2>
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function AnalyzePage() {
  const [input, setInput] = useState("");
  const [compareInput, setCompareInput] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [compareResult, setCompareResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState("");
  const [compareError, setCompareError] = useState("");
  const [watchAdded, setWatchAdded] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: input }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Analysis failed");
      }
      const json: ApiResult = await res.json();
      setResult(json);
      setCompareResult(null);
      setCompareError("");
      setError("");
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to analyze that domain.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!compareInput.trim()) {
      setCompareError("Enter a second domain to compare.");
      return;
    }

    try {
      setIsCompareLoading(true);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: compareInput }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Comparison failed");
      }
      const json: ApiResult = await res.json();
      setCompareResult(json);
      setCompareError("");
    } catch (caughtError) {
      setCompareResult(null);
      setCompareError(caughtError instanceof Error ? caughtError.message : "Unable to compare that domain.");
    } finally {
      setIsCompareLoading(false);
    }
  };

  const comparisonVerdict =
    result && compareResult
      ? result.score > compareResult.score && result.investmentScore >= compareResult.investmentScore
        ? `${result.domain} appears stronger for resale potential.`
        : compareResult.brandPrestigeScore > result.brandPrestigeScore
          ? `${compareResult.domain} appears stronger for brand value.`
          : `${compareResult.domain} appears stronger for resale potential.`
      : null;

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
        <div className="relative grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-[#111318] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Analysis Terminal</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">Domain investigation</h1>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Score quality, normalize market value, inspect RDAP history, and decide whether to buy, watch, or avoid.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-slate-300">
                    Primary Domain
                  </label>
                  <input
                    id="domain"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleAnalyze();
                    }}
                    placeholder="example.com"
                    className="data-mono mt-2 min-h-[52px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base text-slate-100 outline-none placeholder:text-slate-500 focus:border-[var(--lime)] focus:ring-2 focus:ring-[var(--lime)]/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="btn-lime inline-flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-semibold disabled:opacity-70"
                >
                  {isLoading ? "Analyzing..." : "Analyze Domain"}
                </button>

                {error ? (
                  <div className="rounded-2xl border border-[#fca5a5]/40 bg-[#2b1111] px-4 py-3 text-sm text-[#fecaca]">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#111318] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Comparison</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Screen against another domain</h2>
              </div>

              <div className="mt-5 space-y-4">
                <input
                  value={compareInput}
                  onChange={(event) => setCompareInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleCompare();
                  }}
                  placeholder="compare another domain"
                  className="data-mono min-h-[52px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base text-slate-100 outline-none placeholder:text-slate-500 focus:border-[var(--lime)] focus:ring-2 focus:ring-[var(--lime)]/20"
                />
                <button
                  type="button"
                  onClick={handleCompare}
                  disabled={!result || isCompareLoading}
                  className="btn-ghost inline-flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-semibold disabled:opacity-60"
                >
                  {isCompareLoading ? "Comparing..." : "Compare Domains"}
                </button>
                {compareError ? (
                  <div className="rounded-2xl border border-[#fca5a5]/40 bg-[#2b1111] px-4 py-3 text-sm text-[#fecaca]">
                    {compareError}
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
                Intelligence workspace
              </div>
              <h2 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Technical, valuation, and acquisition signals in one domain research surface.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                Built to feel like a serious domain intelligence desk: score layers, RDAP details, benchmarked valuation,
                resale posture, value projection, and deterministic recommendation output.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-white/10 bg-[#101726] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Scoring stack</p>
                <p className="data-mono mt-3 text-3xl font-semibold text-white">10 signals</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">TLD strength, brandability, market posture, and penalties.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-[#101726] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Market anchors</p>
                <p className="data-mono mt-3 text-3xl font-semibold text-white">TLD median refs</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Curated benchmark values keep estimates believable.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-[#101726] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">RDAP visibility</p>
                <p className="data-mono mt-3 text-3xl font-semibold text-white">Registrar-first</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Lifecycle timing and ownership metadata where available.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-[#101726] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Monitoring flow</p>
                <p className="data-mono mt-3 text-3xl font-semibold text-white">Watch ready</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Track taken assets and recheck them from the watchlist.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {result ? (
        <>
          <section className="mt-10 grid-paper rounded-[30px] border border-black p-4 sm:p-6">
            <div className="panel-white rounded-[28px] p-6 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-black pb-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">Active Domain</p>
                  <h2 className="data-mono mt-2 text-3xl font-semibold text-black sm:text-4xl">{result.domain}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                    {result.investmentReport.summary}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeForAvailability(result.availabilityStatus)}`}>
                    {result.availabilityStatus}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeForRecommendation(result.investmentReport.recommendation)}`}>
                    {result.investmentReport.recommendation}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeForRisk(result.riskLevel)}`}>
                    Risk: {result.riskLevel}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Final Score" value={`${result.score}`} subtext={result.verdict} mono />
                <StatCard
                  label="Estimated Value"
                  value={formatCurrency(result.adjustedEstimatedValueUsd)}
                  subtext="Adjusted estimate"
                  mono
                />
                <StatCard label="Availability" value={result.availabilityStatus} subtext="RDAP-backed where available" />
                <StatCard label="Resale Status" value={titleCaseLabel(result.resaleStatus)} subtext={result.detectedMarketplace ?? "No marketplace link detected"} />
                <StatCard label="Recommendation" value={result.investmentReport.recommendation} subtext={`Resale potential: ${result.investmentReport.resalePotential}`} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Investment Score" value={`${result.investmentScore}`} mono />
                <StatCard label="Brand Prestige" value={`${result.brandPrestigeScore}`} mono />
                <StatCard label="Market Score" value={`${result.marketScore}`} mono />
                <StatCard label="Liquidity Score" value={`${result.liquidityScore}`} mono />
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_390px]">
            <div className="space-y-6">
              <SectionCard
                eyebrow="Value Projection"
                title="Projected scenario range"
                aside={
                  <div className="rounded-full border border-black bg-[var(--lime)] px-3 py-1 text-sm font-semibold text-black">
                    Confidence: {result.valueProjection.confidence}
                  </div>
                }
              >
                <ValueProjectionChart projection={result.valueProjection} />
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  Projection is estimated from scoring signals and market data. It is not a guaranteed resale outcome.
                </p>
              </SectionCard>

              <SectionCard
                eyebrow="Investment Report"
                title="Deterministic recommendation"
                aside={
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeForRecommendation(result.investmentReport.recommendation)}`}>
                    {result.investmentReport.recommendation}
                  </span>
                }
              >
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Summary</p>
                    <p className="mt-4 text-sm leading-7 text-slate-700">{result.investmentReport.summary}</p>
                  </div>
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Ideal Buyer Profile</p>
                    <p className="mt-4 text-sm leading-7 text-slate-700">{result.investmentReport.idealBuyerProfile}</p>
                    <div className="mt-5 rounded-2xl border border-black bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Resale Potential</p>
                      <p className="mt-2 text-lg font-semibold text-black">{result.investmentReport.resalePotential}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Reasons To Buy</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {result.investmentReport.reasonsToBuy.map((item) => (
                        <li key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Reasons To Avoid</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {result.investmentReport.reasonsToAvoid.map((item) => (
                        <li key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Best Use Cases</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {result.investmentReport.bestUseCases.map((item) => (
                        <li key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid gap-4">
                    <div className="panel-white-soft rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Acquisition Strategy</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{result.investmentReport.acquisitionStrategy}</p>
                    </div>
                    <div className="panel-white-soft rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Risk Explanation</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{result.investmentReport.riskExplanation}</p>
                    </div>
                    <div className="panel-white-soft rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Final Verdict</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{result.investmentReport.finalVerdict}</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Technical Scoring"
                title="Component contribution"
                aside={<p className="text-sm text-slate-600">Positive categories add value. Penalties reduce the final score.</p>}
              >
                <div className="grid gap-3 xl:grid-cols-2">
                  {(Object.entries(result.breakdown || {}) as Array<[string, number]>).map(([key, value]) => {
                    const isPenalty = key === "riskPenalties";
                    const max = BREAKDOWN_MAX[key];
                    const width = max ? Math.max(6, Math.min(100, (value / max) * 100)) : 10;

                    return (
                      <div key={key} className="panel-white-soft rounded-[22px] p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-black">{BREAKDOWN_LABELS[key] ?? key}</p>
                            <p className="mt-1 text-xs text-slate-500">{isPenalty ? "Penalty category" : "Positive category"}</p>
                          </div>
                          <p className="data-mono text-sm font-semibold text-black">
                            {isPenalty ? "-" : "+"}
                            {value}
                            <span className="ml-1 text-slate-500">/ {max}</span>
                          </p>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-black/10">
                          <div
                            className={`h-2 rounded-full ${isPenalty ? "bg-black" : "bg-[var(--purple-bar)]"}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              {compareResult ? (
                <SectionCard eyebrow="Domain Comparison" title="Side-by-side analytics">
                  <DomainComparisonChart primary={result} secondary={compareResult} />
                  {comparisonVerdict ? (
                    <div className="mt-4 rounded-2xl border border-black bg-[var(--lime)] px-4 py-3 text-sm font-medium text-black">
                      {comparisonVerdict}
                    </div>
                  ) : null}
                </SectionCard>
              ) : null}
            </div>

            <div className="space-y-6">
              <SectionCard eyebrow="RDAP Details" title="Registration metadata">
                <div className="grid gap-3">
                  <DetailRow label="Registrar" value={result.rdap.registrar ?? "Not available"} mono />
                  <DetailRow label="Created" value={formatDate(result.rdap.createdAt)} mono />
                  <DetailRow label="Expires" value={formatDate(result.rdap.expiresAt)} mono />
                  <DetailRow label="Updated" value={formatDate(result.rdap.updatedAt)} mono />
                  <DetailRow
                    label="Status tags"
                    value={result.rdap.statuses?.length ? result.rdap.statuses.join(", ") : "Not available"}
                  />
                </div>
              </SectionCard>

              <SectionCard eyebrow="Valuation Layer" title="Benchmark normalized estimates">
                <div className="grid gap-3">
                  <DetailRow label="Raw appraisal signal" value={formatCurrency(result.estimatedValueUsd)} mono />
                  <DetailRow label="Adjusted estimated value" value={formatCurrency(result.adjustedEstimatedValueUsd)} mono />
                  <DetailRow label="TLD market benchmark" value={formatCurrency(result.tldMarketAnchorUsd)} mono />
                  <DetailRow label="Liquidity score" value={`${result.liquidityScore}`} mono />
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  Based on recent historical sales references. External appraisal inputs remain a signal, not the final value.
                </p>
              </SectionCard>

              <SectionCard eyebrow="Comparable Sales" title="Market posture">
                <div className="grid gap-3">
                  <DetailRow label="Comparable sale count" value={`${result.comparableSalesCount}`} mono />
                  <DetailRow label="Market score" value={`${result.marketScore}`} mono />
                  <DetailRow label="Resale status" value={titleCaseLabel(result.resaleStatus)} />
                  <DetailRow label="Marketplace" value={result.detectedMarketplace ?? "Not detected"} />
                  <DetailRow label="Asking price" value={formatCurrency(result.askingPrice)} mono />
                </div>
              </SectionCard>

              <SectionCard eyebrow="Availability Action" title="Acquire or monitor">
                <div className="flex flex-wrap gap-3">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeForAvailability(result.availabilityStatus)}`}>
                    {result.availabilityStatus}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeForRecommendation(result.investmentReport.recommendation)}`}>
                    {result.investmentReport.recommendation}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  Availability checking, market posture, and registrar timing are visible here so the next action is obvious even before automation exists.
                </p>
                <div className="mt-5 grid gap-3">
                  {result.availabilityStatus === "Available" ? (
                    <button type="button" className="btn-lime inline-flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-semibold">
                      Register Domain
                    </button>
                  ) : result.availabilityStatus === "Taken" ? (
                    <button
                      type="button"
                      onClick={() => {
                        const added = addToWatchlist({
                          domain: result.domain,
                          score: result.score,
                          availabilityStatus: result.availabilityStatus,
                          resaleStatus: result.resaleStatus ?? null,
                          estimatedValueUsd: result.adjustedEstimatedValueUsd ?? null,
                          registrar: result.rdap?.registrar ?? null,
                          expiresAt: result.rdap?.expiresAt ?? null,
                        });
                        if (added) {
                          setWatchAdded(result.domain);
                          setTimeout(() => setWatchAdded(null), 3000);
                        } else {
                          setWatchAdded(result.domain);
                          setTimeout(() => setWatchAdded(null), 1500);
                        }
                      }}
                      className="btn-ghost inline-flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-semibold"
                    >
                      {watchAdded === result.domain ? "Added To Watchlist" : "Notify When Available"}
                    </button>
                  ) : (
                    <button type="button" className="btn-ghost inline-flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-semibold">
                      Check Again Later
                    </button>
                  )}
                  <Link href="/watchlist" className="rounded-full border border-black bg-white px-5 py-3 text-center text-sm font-semibold text-black">
                    Open Watchlist
                  </Link>
                </div>
              </SectionCard>
            </div>
          </section>
        </>
      ) : (
        <section className="mt-10 grid-paper rounded-[30px] border border-black p-4 sm:p-6">
          <div className="panel-white rounded-[28px] p-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="panel-white-soft rounded-[22px] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Valuation Engine</p>
                <p className="mt-3 text-2xl font-semibold text-black">Anchor-aware</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">Benchmark-normalized market ranges and believable score-weighted estimates.</p>
              </div>
              <div className="panel-white-soft rounded-[22px] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">RDAP Lookup</p>
                <p className="mt-3 text-2xl font-semibold text-black">Technical</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">Registrar history, ownership posture, expiry windows, and status metadata.</p>
              </div>
              <div className="panel-white-soft rounded-[22px] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Comparison Layer</p>
                <p className="mt-3 text-2xl font-semibold text-black">Portfolio-ready</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">Compare candidate domains and monitor valuation posture before acting.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
