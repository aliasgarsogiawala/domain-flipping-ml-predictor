"use client";

import { useState } from "react";
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
  tldStrength: "TLD strength",
  length: "Length",
  brandability: "Brandability",
  memorability: "Memorability",
  pronounceability: "Pronounceability",
  premiumBrandSignal: "Premium brand signal",
  trendRelevance: "Trend relevance",
  commercialIntent: "Commercial intent",
  registrationHistory: "Registration history",
  riskPenalties: "Risk penalties",
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
  if (!dateString) {
    return "Not available";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function badgeForAvailability(value: ApiResult["availabilityStatus"]) {
  if (value === "Available") {
    return "border-[#b7e4c7] bg-[#ecfdf3] text-[#067647]";
  }

  if (value === "Taken") {
    return "border-[#d9dde5] bg-[#f8fafc] text-slate-700";
  }

  return "border-[#fed7aa] bg-[#fff7ed] text-[#b54708]";
}

function badgeForRisk(value: ApiResult["riskLevel"]) {
  if (value === "Low") {
    return "border-[#b7e4c7] bg-[#ecfdf3] text-[#067647]";
  }

  if (value === "Medium") {
    return "border-[#fed7aa] bg-[#fff7ed] text-[#b54708]";
  }

  return "border-[#fecaca] bg-[#fef3f2] text-[#b42318]";
}

function badgeForRecommendation(value: InvestmentReport["recommendation"]) {
  if (value === "Buy") {
    return "border-[#f2d7c0] bg-[#fff2e8] text-[#b54708]";
  }

  if (value === "Watch") {
    return "border-[#d9dde5] bg-[#f8fafc] text-slate-700";
  }

  return "border-[#fecaca] bg-[#fef3f2] text-[#b42318]";
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
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to analyze that domain.",
      );
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
      setCompareError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to compare that domain.",
      );
    } finally {
      setIsCompareLoading(false);
    }
  };

  const comparisonVerdict =
    result && compareResult
      ? result.score > compareResult.score &&
        result.investmentScore >= compareResult.investmentScore
        ? `${result.domain} appears stronger for resale potential.`
        : compareResult.brandPrestigeScore > result.brandPrestigeScore
          ? `${compareResult.domain} appears stronger for brand value.`
          : `${compareResult.domain} appears stronger for resale potential.`
      : null;

  return (
    <main className="pb-16">
      <section className="mb-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Domain intelligence workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Analyze domains like a registrar-grade dashboard.
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            Review ownership data, market heuristics, score composition, domain status,
            and projected scenario ranges inside a structured platform-style layout.
          </p>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-28">
          <div className="surface-strong rounded-3xl p-6">
            <div className="border-b border-[#eceef2] pb-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Search workspace
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Analyze a domain
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter a raw domain or full URL to normalize, score, and inspect registration details.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-slate-700">
                  Domain input
                </label>
                <input
                  id="domain"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleAnalyze();
                    }
                  }}
                  placeholder="example.com"
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dfe2e7] bg-white px-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#F48120] focus:ring-2 focus:ring-[#fde6d4]"
                />
              </div>

              <div className="surface-muted rounded-2xl p-4 text-sm leading-6 text-slate-600">
                RDAP ownership checks run from the backend. Market pricing remains a lightweight signal in this MVP.
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="accent-button inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Analyzing..." : "Analyze domain"}
              </button>

              {error ? (
                <div className="rounded-2xl border border-[#fecaca] bg-[#fef3f2] px-4 py-3 text-sm text-[#b42318]">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="surface rounded-3xl p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Comparison
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="compare-domain"
                  className="block text-sm font-medium text-slate-700"
                >
                  Compare with another domain
                </label>
                <input
                  id="compare-domain"
                  value={compareInput}
                  onChange={(event) => setCompareInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleCompare();
                    }
                  }}
                  placeholder="anotherdomain.com"
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#dfe2e7] bg-white px-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#F48120] focus:ring-2 focus:ring-[#fde6d4]"
                />
              </div>
              <button
                type="button"
                onClick={handleCompare}
                disabled={!result || isCompareLoading}
                className="secondary-button inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCompareLoading ? "Comparing..." : "Compare"}
              </button>
              {compareError ? (
                <div className="rounded-2xl border border-[#fecaca] bg-[#fef3f2] px-4 py-3 text-sm text-[#b42318]">
                  {compareError}
                </div>
              ) : null}
            </div>
          </div>

          <div className="surface rounded-3xl p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Methodology
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>Scores blend domain quality, market heuristics, and verified registration history.</li>
              <li>Taken domains are not automatically premium; lifecycle quality only adds modest credibility.</li>
              <li>Projections are conservative scenario estimates, not guaranteed outcomes.</li>
            </ul>
          </div>
        </aside>

        <section className="space-y-6">
          {result ? (
            <>
              <div className="surface-strong rounded-3xl p-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Domain overview
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                      {result.domain}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Structured domain assessment with ownership context, registration signals,
                      resale heuristics, and registrar-style availability handling.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <span className="rounded-full border border-[#d9dde5] bg-white px-3 py-1 text-sm font-medium text-slate-700">
                        {result.verdict}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-medium ${badgeForRisk(
                          result.riskLevel,
                        )}`}
                      >
                        Risk: {result.riskLevel}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-medium ${badgeForAvailability(
                          result.availabilityStatus,
                        )}`}
                      >
                        {result.availabilityStatus}
                      </span>
                    </div>
                  </div>

                  <div className="surface rounded-3xl p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Composite score
                    </p>
                    <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">
                      {result.score}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">out of 100</p>
                    <div className="mt-4 h-2 rounded-full bg-[#eceef2]">
                      <div
                        className="h-2 rounded-full bg-[#F48120]"
                        style={{ width: `${Math.max(10, result.score)}%` }}
                      />
                    </div>
                    <div className="mt-5 grid gap-2 text-sm">
                      <div className="flex items-center justify-between rounded-xl border border-[#eceef2] bg-[#fbfaf8] px-3 py-2">
                        <span className="text-slate-600">Rule score</span>
                        <span className="font-medium text-slate-900">{result.ruleScore}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-[#eceef2] bg-[#fbfaf8] px-3 py-2">
                        <span className="text-slate-600">Market score</span>
                        <span className="font-medium text-slate-900">{result.marketScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["TLD", `.${result.tld}`],
                  ["Name", result.name],
                  ["Availability", result.availabilityStatus],
                  ["Investment score", `${result.investmentScore}`],
                  ["Brand prestige", `${result.brandPrestigeScore}`],
                  ["Registrar", result.rdap.registrar ?? "Not available"],
                  ["Created", formatDate(result.rdap.createdAt)],
                  ["Expires", formatDate(result.rdap.expiresAt)],
                  ["Estimated value", `$${result.estimatedValueUsd?.toLocaleString?.() ?? result.estimatedValueUsd}`],
                  ["Comparable sales", `${result.marketData?.comparableSalesCount ?? result.comparableSalesCount ?? 0}`],
                ].map(([label, value]) => (
                  <div key={label} className="surface rounded-2xl p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
                <div className="space-y-6">
                  <div className="surface-strong rounded-3xl p-6">
                    <div className="flex flex-col gap-2 border-b border-[#eceef2] pb-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Value projection
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                          Projected scenario range
                        </h3>
                      </div>
                      <div className="rounded-full border border-[#d9dde5] bg-white px-3 py-1 text-sm font-medium text-slate-700">
                        Confidence: {result.valueProjection.confidence}
                      </div>
                    </div>
                    <div className="mt-5">
                      <ValueProjectionChart projection={result.valueProjection} />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      Projection is estimated from scoring signals and market data. It is not a guaranteed resale outcome.
                    </p>
                  </div>

                  <div className="surface-strong rounded-3xl p-6">
                    <div className="flex flex-col gap-3 border-b border-[#eceef2] pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Investment report
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                          Deterministic recommendation
                        </h3>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${badgeForRecommendation(
                          result.investmentReport.recommendation,
                        )}`}
                      >
                        {result.investmentReport.recommendation}
                      </span>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-600">
                      {result.investmentReport.summary}
                    </p>

                    <div className="mt-5 grid gap-6 xl:grid-cols-2">
                      <section className="surface-muted rounded-2xl p-5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Reasons to buy
                        </p>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                          {result.investmentReport.reasonsToBuy.map((reason) => (
                            <li key={reason} className="border-b border-[#eceef2] pb-3 last:border-b-0 last:pb-0">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section className="surface-muted rounded-2xl p-5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Reasons to avoid
                        </p>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                          {result.investmentReport.reasonsToAvoid.map((reason) => (
                            <li key={reason} className="border-b border-[#eceef2] pb-3 last:border-b-0 last:pb-0">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                      <div className="surface rounded-2xl p-5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Best use cases
                        </p>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                          {result.investmentReport.bestUseCases.map((useCase) => (
                            <li key={useCase} className="border-b border-[#eceef2] pb-3 last:border-b-0 last:pb-0">
                              {useCase}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="surface rounded-2xl p-5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Buyer profile
                        </p>
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          {result.investmentReport.idealBuyerProfile}
                        </p>
                        <div className="mt-5 rounded-2xl border border-[#eceef2] bg-[#fbfaf8] px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            Resale potential
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-950">
                            {result.investmentReport.resalePotential}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                      <div className="surface rounded-2xl p-5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Acquisition strategy
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {result.investmentReport.acquisitionStrategy}
                        </p>
                      </div>
                      <div className="surface rounded-2xl p-5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Risk explanation
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {result.investmentReport.riskExplanation}
                        </p>
                      </div>
                      <div className="surface rounded-2xl p-5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Final verdict
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {result.investmentReport.finalVerdict}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="surface-strong rounded-3xl p-6">
                    <div className="flex flex-col gap-2 border-b border-[#eceef2] pb-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Score breakdown
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                          Component contribution
                        </h3>
                      </div>
                      <p className="text-sm text-slate-500">
                        Positive categories add value. Risk penalties reduce the final score.
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 xl:grid-cols-2">
                      {(Object.entries(result.breakdown || {}) as Array<[string, number]>).map(
                        ([key, value]) => {
                          const isPenalty = key === "riskPenalties";
                          const max = BREAKDOWN_MAX[key];
                          const width = max ? Math.max(8, (value / max) * 100) : 10;

                          return (
                            <div key={key} className="surface-muted rounded-2xl p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {BREAKDOWN_LABELS[key] ?? key}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {isPenalty ? "Penalty category" : "Positive category"}
                                  </p>
                                </div>
                                <p className={`text-sm font-semibold ${isPenalty ? "text-[#b42318]" : "text-slate-900"}`}>
                                  {isPenalty ? "-" : "+"}
                                  {value}
                                  <span className="ml-1 text-slate-500">/ {max}</span>
                                </p>
                              </div>
                              <div className="mt-3 h-2 rounded-full bg-[#eceef2]">
                                <div
                                  className={`h-2 rounded-full ${isPenalty ? "bg-[#d0d5dd]" : "bg-[#F48120]"}`}
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <section className="surface rounded-3xl p-6">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Strengths
                      </p>
                      <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                        {result.reasons.map((reason) => (
                          <li key={reason} className="border-b border-[#f1f2f5] pb-3 last:border-b-0 last:pb-0">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="surface rounded-3xl p-6">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Weaknesses
                      </p>
                      <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                        {result.weaknesses.length > 0 ? (
                          result.weaknesses.map((weakness) => (
                            <li
                              key={weakness}
                              className="border-b border-[#f1f2f5] pb-3 last:border-b-0 last:pb-0"
                            >
                              {weakness}
                            </li>
                          ))
                        ) : (
                          <li>No major weaknesses were flagged by the current rules.</li>
                        )}
                      </ul>
                    </section>
                  </div>
                </div>

                <div className="space-y-6">
                  {compareResult ? (
                    <section className="surface-strong rounded-3xl p-6">
                      <div className="flex flex-col gap-2 border-b border-[#eceef2] pb-4">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          Domain comparison
                        </p>
                        <h3 className="text-2xl font-semibold text-slate-950">
                          Compare projected strength
                        </h3>
                      </div>
                      <div className="mt-5">
                        <DomainComparisonChart primary={result} secondary={compareResult} />
                      </div>
                      {comparisonVerdict ? (
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          {comparisonVerdict}
                        </p>
                      ) : null}
                    </section>
                  ) : null}

                  <section className="surface-strong rounded-3xl p-6">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Availability action
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-medium ${badgeForAvailability(
                          result.availabilityStatus,
                        )}`}
                      >
                        {result.availabilityStatus}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      Ownership status is based on RDAP lookup data from the backend. This gives the
                      workspace registrar-style lifecycle visibility without exposing raw protocol payloads.
                    </p>

                    <div className="mt-5">
                      {result.availabilityStatus === "Available" ? (
                        <button
                          type="button"
                          className="accent-button inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-medium"
                        >
                          Register domain
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
                              estimatedValueUsd: result.estimatedValueUsd ?? null,
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
                          className="secondary-button inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-medium"
                        >
                          {watchAdded === result.domain ? "Added to watchlist" : "Notify when available"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="secondary-button inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-medium"
                        >
                          Check again later
                        </button>
                      )}
                    </div>
                  </section>

                  <section className="surface rounded-3xl p-6">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Domain status
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.rdap.statuses.length > 0 ? (
                        result.rdap.statuses.map((status) => (
                          <span
                            key={status}
                            className="rounded-full border border-[#dfe2e7] bg-[#fbfaf8] px-3 py-1 text-sm font-medium text-slate-700"
                          >
                            {status}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-[#dfe2e7] bg-[#fbfaf8] px-3 py-1 text-sm font-medium text-slate-500">
                          No RDAP status flags returned
                        </span>
                      )}
                    </div>
                  </section>

                  <section className="surface rounded-3xl p-6">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Resale signal
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Status</span>
                        <span className="font-medium text-slate-900">{result.resaleStatus ?? "unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Marketplace</span>
                        <span className="font-medium text-slate-900">
                          {result.detectedMarketplace ?? result.marketplaceName ?? "Not detected"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Confidence</span>
                        <span className="font-medium text-slate-900">{result.resaleConfidence ?? "low"}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      Marketplace detection is heuristic and should be verified manually before making acquisition decisions.
                    </p>

                    {result.marketplaceLinks ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(result.marketplaceLinks).map(([key, url]) => (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-[#dfe2e7] bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900"
                          >
                            {key}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>
            </>
          ) : (
            <div className="surface-strong rounded-3xl p-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="surface-muted rounded-2xl p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Availability
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">RDAP-backed</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Registrar-style ownership status and registration metadata.
                  </p>
                </div>
                <div className="surface-muted rounded-2xl p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Projection
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">Scenario range</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Conservative value projections from current domain and market signals.
                  </p>
                </div>
                <div className="surface-muted rounded-2xl p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Comparison
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">Portfolio-ready</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Compare candidate domains side by side before acting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
