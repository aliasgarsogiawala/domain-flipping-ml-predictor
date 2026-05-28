"use client";

import { useState } from "react";
import Link from "next/link";
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
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function badgeForAvailability(value: ApiResult["availabilityStatus"]) {
  if (value === "Available") return "bg-accent-lime text-foreground";
  if (value === "Taken") return "bg-card text-foreground";
  return "bg-background text-foreground";
}

function badgeForRisk(value: ApiResult["riskLevel"]) {
  if (value === "Low") return "bg-accent-lime text-foreground";
  return "bg-background text-foreground";
}

function badgeForRecommendation(value: InvestmentReport["recommendation"]) {
  if (value === "Buy") return "bg-accent-lime text-foreground";
  if (value === "Watch") return "bg-card text-foreground";
  return "bg-background text-foreground";
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black rounded-lg bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-foreground">{label}</p>
      <p className="mt-3 text-lg font-bold font-mono-data text-accent-lime">{value}</p>
    </div>
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
    <main className="pb-16 pt-4">
      <section className="mb-8 border-b-2 border-black pb-8">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
          <p className="text-sm font-bold uppercase tracking-wide text-foreground">Investigation workspace</p>
          <h1 className="mt-3 text-5xl font-extrabold leading-tight text-foreground sm:text-6xl">
            Analyze domains like a registrar intelligence dashboard.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-7 text-foreground">
            Review ownership data, market heuristics, score composition, and investment potential inside a structured platform-style layout.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-start gap-6 px-6 sm:px-8 lg:px-12 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-28">
          <div className="border-2 border-black rounded-lg bg-card p-6">
            <div className="border-b-2 border-black pb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground">Search workspace</p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">Analyze a domain</h2>
              <p className="mt-2 text-sm leading-6 text-foreground">
                Enter a raw domain or full URL to normalize, score, and inspect registration details.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="domain" className="block text-sm font-bold text-foreground">Domain input</label>
                <input
                  id="domain"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAnalyze();
                  }}
                  placeholder="example.com"
                  className="mt-3 min-h-12 w-full rounded-lg border-2 border-black bg-background px-4 text-base text-foreground outline-none placeholder:text-foreground/50 focus:ring-2 focus:ring-button-purple"
                />
              </div>

              <div className="border-2 border-black rounded-lg bg-background p-4 text-sm leading-6 text-foreground">
                RDAP ownership checks run from the backend. Market pricing is normalized against TLD weights.
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="btn-lime inline-flex min-h-12 w-full items-center justify-center rounded-lg font-semibold disabled:opacity-70"
              >
                {isLoading ? "Analyzing..." : "Analyze domain"}
              </button>

              {error ? <div className="rounded-lg border-2 border-black bg-background px-4 py-3 text-sm text-foreground">{error}</div> : null}
            </div>
          </div>

          <div className="border-2 border-black rounded-lg bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">Comparison</p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="compare-domain" className="block text-sm font-bold text-foreground">
                  Compare with another domain
                </label>
                <input
                  id="compare-domain"
                  value={compareInput}
                  onChange={(event) => setCompareInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleCompare();
                  }}
                  placeholder="anotherdomain.com"
                  className="mt-3 min-h-12 w-full rounded-lg border-2 border-black bg-background px-4 text-base text-foreground outline-none placeholder:text-foreground/50 focus:ring-2 focus:ring-button-purple"
                />
              </div>
              <button
                type="button"
                onClick={handleCompare}
                disabled={!result || isCompareLoading}
                className="btn-purple inline-flex min-h-12 w-full items-center justify-center rounded-lg font-semibold disabled:opacity-70"
              >
                {isCompareLoading ? "Comparing..." : "Compare"}
              </button>
              {compareError ? <div className="rounded-lg border-2 border-black bg-background px-4 py-3 text-sm text-foreground">{compareError}</div> : null}
            </div>
          </div>

          <div className="border-2 border-black rounded-lg bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">Methodology</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-foreground">
              <li>• Scores blend domain quality, market heuristics, and registration history.</li>
              <li>• TLD-adjusted valuations prevent unrealistic comparisons.</li>
              <li>• Projections are conservative scenario estimates.</li>
            </ul>
          </div>
        </aside>

        <section className="space-y-6">
          {result ? (
            <>
              <div className="border-2 border-black rounded-lg bg-card p-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground">Domain overview</p>
                    <h2 className="mt-3 text-4xl font-extrabold font-mono-data text-foreground">{result.domain}</h2>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-foreground">
                      Structured domain assessment with ownership context, registration signals, resale heuristics, and registrar-style availability handling.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="rounded-lg border-2 border-black bg-card px-4 py-2 text-sm font-bold text-foreground">{result.verdict}</span>
                      <span className={`rounded-lg border-2 border-black px-4 py-2 text-sm font-bold ${badgeForRisk(result.riskLevel)}`}>Risk: {result.riskLevel}</span>
                      <span className={`rounded-lg border-2 border-black px-4 py-2 text-sm font-bold ${badgeForAvailability(result.availabilityStatus)}`}>{result.availabilityStatus}</span>
                    </div>
                  </div>

                  <div className="border-2 border-black rounded-lg bg-accent-lime p-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground">Composite score</p>
                    <p className="mt-4 text-6xl font-extrabold text-foreground">{result.score}</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">out of 100</p>
                    <div className="mt-6 space-y-2 text-sm">
                      <div className="flex items-center justify-between rounded-lg border-2 border-black bg-background px-4 py-3">
                        <span className="font-semibold text-foreground">Rule score</span>
                        <span className="font-mono-data font-bold text-foreground">{result.ruleScore}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border-2 border-black bg-background px-4 py-3">
                        <span className="font-semibold text-foreground">Market score</span>
                        <span className="font-mono-data font-bold text-foreground">{result.marketScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <StatCard label="TLD" value={`.${result.tld}`} />
                <StatCard label="Name" value={result.name} />
                <StatCard label="Availability" value={result.availabilityStatus} />
                <StatCard label="Investment score" value={`${result.investmentScore}`} />
                <StatCard label="Brand prestige" value={`${result.brandPrestigeScore}`} />
                <StatCard label="Registrar" value={result.rdap.registrar ?? "Not available"} />
                <StatCard label="Created" value={formatDate(result.rdap.createdAt)} />
                <StatCard label="Expires" value={formatDate(result.rdap.expiresAt)} />
                <StatCard label="Estimated value" value={`$${result.adjustedEstimatedValueUsd.toLocaleString()}`} />
                <StatCard label="Comparable sales" value={`${result.marketData?.comparableSalesCount ?? result.comparableSalesCount ?? 0}`} />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
                <div className="space-y-6">
                  <div className="border-2 border-black rounded-lg bg-card p-8">
                    <div className="flex flex-col gap-2 border-b-2 border-black pb-6 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">TLD Market Benchmark</p>
                        <h3 className="mt-3 text-2xl font-bold text-foreground">Historical anchor normalization</h3>
                      </div>
                      <div className="border-2 border-black bg-background px-4 py-2 rounded-lg text-sm font-bold text-foreground">Liquidity: {result.liquidityScore}</div>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <StatCard label="TLD Market Benchmark" value={`$${result.tldMarketAnchorUsd.toLocaleString()}`} />
                      <StatCard label="Adjusted Value" value={`$${result.adjustedEstimatedValueUsd.toLocaleString()}`} />
                      <StatCard label="Raw Appraisal" value={`$${result.estimatedValueUsd.toLocaleString()}`} />
                    </div>
                    <p className="mt-6 text-sm leading-7 text-foreground">
                      Based on historical sales references. Appraisal estimates are normalized against TLD market weight and resale liquidity.
                    </p>
                  </div>

                  <div className="border-2 border-black rounded-lg bg-card p-8">
                    <div className="flex flex-col gap-2 border-b-2 border-black pb-6 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Value projection</p>
                        <h3 className="mt-3 text-2xl font-bold text-foreground">Projected scenario range</h3>
                      </div>
                      <div className="border-2 border-black bg-background px-4 py-2 rounded-lg text-sm font-bold text-foreground">
                        Confidence: {result.valueProjection.confidence}
                      </div>
                    </div>
                    <div className="mt-6">
                      <ValueProjectionChart projection={result.valueProjection} />
                    </div>
                    <p className="mt-6 text-sm leading-7 text-foreground">
                      Projection is estimated from scoring signals and market data. It is not a guaranteed resale outcome.
                    </p>
                  </div>

                  <div className="border-2 border-black rounded-lg bg-card p-8">
                    <div className="flex flex-col gap-3 border-b-2 border-black pb-6 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Investment report</p>
                        <h3 className="mt-3 text-2xl font-bold text-foreground">Deterministic recommendation</h3>
                      </div>
                      <span className={`inline-flex rounded-lg border-2 border-black px-4 py-2 text-sm font-bold ${badgeForRecommendation(result.investmentReport.recommendation)}`}>
                        {result.investmentReport.recommendation}
                      </span>
                    </div>

                    <p className="mt-6 text-sm leading-7 text-foreground">{result.investmentReport.summary}</p>

                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                      <section className="border-2 border-black rounded-lg bg-background p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Reasons to buy</p>
                        <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground">
                          {result.investmentReport.reasonsToBuy.map((reason: string) => (
                            <li key={reason} className="border-b border-black pb-3 last:border-b-0 last:pb-0">• {reason}</li>
                          ))}
                        </ul>
                      </section>

                      <section className="border-2 border-black rounded-lg bg-background p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Reasons to avoid</p>
                        <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground">
                          {result.investmentReport.reasonsToAvoid.map((reason: string) => (
                            <li key={reason} className="border-b border-black pb-3 last:border-b-0 last:pb-0">• {reason}</li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                      <div className="border-2 border-black rounded-lg bg-background p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Best use cases</p>
                        <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground">
                          {result.investmentReport.bestUseCases.map((useCase: string) => (
                            <li key={useCase} className="border-b border-black pb-3 last:border-b-0 last:pb-0">• {useCase}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-2 border-black rounded-lg bg-background p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Buyer profile</p>
                        <p className="mt-4 text-sm leading-6 text-foreground">{result.investmentReport.idealBuyerProfile}</p>
                        <div className="mt-4 border-2 border-black rounded-lg bg-accent-lime px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-foreground">Resale potential</p>
                          <p className="mt-2 text-lg font-bold text-foreground">{result.investmentReport.resalePotential}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="border-2 border-black rounded-lg bg-background p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Acquisition strategy</p>
                        <p className="mt-3 text-sm leading-6 text-foreground">{result.investmentReport.acquisitionStrategy}</p>
                      </div>
                      <div className="border-2 border-black rounded-lg bg-background p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Risk explanation</p>
                        <p className="mt-3 text-sm leading-6 text-foreground">{result.investmentReport.riskExplanation}</p>
                      </div>
                      <div className="border-2 border-black rounded-lg bg-background p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Final verdict</p>
                        <p className="mt-3 text-sm leading-6 text-foreground">{result.investmentReport.finalVerdict}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-black rounded-lg bg-card p-8">
                    <div className="flex flex-col gap-2 border-b-2 border-black pb-6 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Score breakdown</p>
                        <h3 className="mt-3 text-2xl font-bold text-foreground">Component contribution</h3>
                      </div>
                      <p className="text-sm text-foreground">Categories add value. Risk penalties reduce the score.</p>
                    </div>

                    <div className="mt-6 grid gap-3 xl:grid-cols-2">
                      {(Object.entries(result.breakdown || {}) as Array<[string, number]>).map(([key, value]) => {
                        const isPenalty = key === "riskPenalties";
                        const max = BREAKDOWN_MAX[key];
                        const width = max ? Math.max(8, (value / max) * 100) : 10;
                        return (
                          <div key={key} className="border-2 border-black rounded-lg bg-background p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-bold text-foreground">{BREAKDOWN_LABELS[key] ?? key}</p>
                                <p className="mt-1 text-xs text-foreground/70">{isPenalty ? "Penalty" : "Positive"}</p>
                              </div>
                              <p className={`text-sm font-bold font-mono-data ${isPenalty ? "text-foreground" : "text-accent-lime"}`}>
                                {isPenalty ? "-" : "+"}{value} / {max}
                              </p>
                            </div>
                            <div className="mt-3 h-3 rounded-lg border-2 border-black bg-background">
                              <div className={`h-3 rounded-lg ${isPenalty ? "bg-foreground/30" : "bg-accent-lime"}`} style={{ width: `${width}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <section className="border-2 border-black rounded-lg bg-card p-6">
                      <p className="text-xs font-bold uppercase tracking-wide text-foreground">Strengths</p>
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground">
                        {result.reasons.map((reason: string) => (
                          <li key={reason} className="border-b border-black pb-3 last:border-b-0 last:pb-0">• {reason}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="border-2 border-black rounded-lg bg-card p-6">
                      <p className="text-xs font-bold uppercase tracking-wide text-foreground">Weaknesses</p>
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground">
                        {result.weaknesses.length > 0 ? (
                          result.weaknesses.map((weakness: string) => (
                            <li key={weakness} className="border-b border-black pb-3 last:border-b-0 last:pb-0">• {weakness}</li>
                          ))
                        ) : (
                          <li>No major weaknesses flagged.</li>
                        )}
                      </ul>
                    </section>
                  </div>
                </div>

                <div className="space-y-6">
                  {compareResult ? (
                    <section className="border-2 border-black rounded-lg bg-card p-6">
                      <div className="flex flex-col gap-2 border-b-2 border-black pb-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground">Domain comparison</p>
                        <h3 className="text-2xl font-bold text-foreground">Compare projected strength</h3>
                      </div>
                      <div className="mt-5">
                        <DomainComparisonChart primary={result} secondary={compareResult} />
                      </div>
                      {comparisonVerdict ? <p className="mt-4 text-sm leading-6 text-foreground">{comparisonVerdict}</p> : null}
                    </section>
                  ) : null}

                  <section className="border-2 border-black rounded-lg bg-card p-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground">Availability action</p>
                    <div className="mt-4 flex items-center gap-3">
                      <span className={`rounded-lg border-2 border-black px-4 py-2 text-sm font-bold ${badgeForAvailability(result.availabilityStatus)}`}>
                        {result.availabilityStatus}
                      </span>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-foreground">
                      Ownership status is based on RDAP lookup data from the backend. This gives registrar-style visibility.
                    </p>

                    <div className="mt-6">
                      {result.availabilityStatus === "Available" ? (
                        <button type="button" className="btn-lime inline-flex min-h-12 w-full items-center justify-center rounded-lg font-semibold">
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
                              estimatedValueUsd: result.adjustedEstimatedValueUsd ?? null,
                              registrar: result.rdap?.registrar ?? null,
                              expiresAt: result.rdap?.expiresAt ?? null,
                            });
                            setWatchAdded(result.domain);
                            setTimeout(() => setWatchAdded(null), added ? 3000 : 1500);
                          }}
                          className="btn-purple inline-flex min-h-12 w-full items-center justify-center rounded-lg font-semibold"
                        >
                          {watchAdded === result.domain ? "Added to watchlist" : "Watch domain"}
                        </button>
                      ) : (
                        <button type="button" className="btn-purple inline-flex min-h-12 w-full items-center justify-center rounded-lg font-semibold">
                          Check again later
                        </button>
                      )}
                    </div>
                  </section>

                  <section className="border-2 border-black rounded-lg bg-card p-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground">Domain status</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.rdap.statuses.length > 0 ? (
                        result.rdap.statuses.map((status: string) => (
                          <span key={status} className="rounded-lg border-2 border-black bg-background px-3 py-1 text-sm font-semibold text-foreground">
                            {status}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-lg border-2 border-black bg-background px-3 py-1 text-sm font-semibold text-foreground/70">
                          No RDAP status flags
                        </span>
                      )}
                    </div>
                  </section>

                  <section className="border-2 border-black rounded-lg bg-card p-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground">Resale signal</p>
                    <div className="mt-4 space-y-3 text-sm text-foreground">
                      <div className="flex items-center justify-between border-b border-black pb-3"><span>Status</span><span className="font-bold">{result.resaleStatus ?? "unknown"}</span></div>
                      <div className="flex items-center justify-between border-b border-black pb-3"><span>Marketplace</span><span className="font-bold">{result.detectedMarketplace ?? result.marketplaceName ?? "Not detected"}</span></div>
                      <div className="flex items-center justify-between"><span>Confidence</span><span className="font-bold">{result.resaleConfidence ?? "low"}</span></div>
                    </div>
                    <p className="mt-4 text-xs text-foreground/70">Marketplace detection is heuristic. Verify manually before acting.</p>

                    {result.marketplaceLinks ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(result.marketplaceLinks).map(([key, url]) => (
                          <a key={key} href={url} target="_blank" rel="noreferrer" className="border-2 border-black bg-background rounded-lg px-3 py-2 text-xs font-bold text-foreground hover:bg-accent-lime transition-colors">
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
            <div className="border-2 border-black rounded-lg bg-card p-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="border-2 border-black rounded-lg bg-background p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground">Availability</p>
                  <p className="mt-4 text-2xl font-bold text-foreground">RDAP-backed</p>
                  <p className="mt-3 text-sm leading-6 text-foreground">Registrar-style ownership status and registration metadata.</p>
                </div>
                <div className="border-2 border-black rounded-lg bg-background p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground">Projection</p>
                  <p className="mt-4 text-2xl font-bold text-foreground">Scenario range</p>
                  <p className="mt-3 text-sm leading-6 text-foreground">Conservative value projections from domain and market signals.</p>
                </div>
                <div className="border-2 border-black rounded-lg bg-background p-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground">Comparison</p>
                  <p className="mt-4 text-2xl font-bold text-foreground">Portfolio-ready</p>
                  <p className="mt-3 text-sm leading-6 text-foreground">Compare candidate domains side by side before acting.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
