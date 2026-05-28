"use client";

import { useState } from "react";
import Link from "next/link";

type ApiResult = {
  domain: string;
  score: number;
  ruleScore: number;
  marketScore: number;
  availabilityStatus: "Available" | "Taken" | "Unknown";
  estimatedValueUsd: number;
  verdict: "Low Potential" | "Moderate Potential" | "High Potential" | "Premium Potential";
  riskLevel: "Low" | "Medium" | "High";
  reasons: string[];
  weaknesses: string[];
  marketData: any;
  tld: string;
  name: string;
  breakdown: Record<string, number>;
  comparableSalesCount: number;}
 

function labelForAvailability(availabilityStatus: "Available" | "Taken" | "Unknown") {
  if (availabilityStatus === "Available") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (availabilityStatus === "Taken") {
    return "border-slate-600 bg-slate-900 text-slate-200";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-300";
}

const BREAKDOWN_LABELS: Record<string, string> = {
  tldStrength: "TLD strength",
  length: "Length",
  brandability: "Brandability",
  memorability: "Memorability",
  pronounceability: "Pronounceability",
  premiumBrandSignal: "Premium brand signal",
  trendRelevance: "Trend relevance",
  commercialIntent: "Commercial intent",
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
  riskPenalties: 20,
};

function labelForRisk(riskLevel: "Low" | "Medium" | "High") {
  if (riskLevel === "Low") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (riskLevel === "Medium") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-red-500/20 bg-red-500/10 text-red-300";
}

export default function AnalyzePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    try {
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
      setError("");
    } catch (caughtError) {
      setResult(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to analyze that domain.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-slate-400">
              DomainFlip AI
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Domain analyzer
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Enter a domain and review its score, risk profile, and the signals
              affecting resale potential.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-600 hover:text-slate-100"
          >
            Back to home
          </Link>
        </header>

        <section className="mt-10 grid items-start gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-6 xl:sticky xl:top-8">
            <div className="panel rounded-3xl p-6">
              <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/8 pb-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.26em] text-slate-500">
                    Workspace
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-50">
                    Domain screening
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Review pricing signals, resale quality, and availability in one pass.
                  </p>
                </div>
                <div className="rounded-xl border border-white/8 bg-zinc-950 px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Mode
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">Rule-based MVP</p>
                </div>
              </div>

              <div className="panel-strong rounded-2xl p-5">
              <label
                htmlFor="domain"
                className="block text-sm font-medium text-slate-300"
              >
                Domain name
              </label>
              <p className="mt-2 text-sm text-slate-500">
                Supports raw domains or full URLs. Example: `brandname.com`
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <input
                  id="domain"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleAnalyze();
                    }
                  }}
                  placeholder="Enter a domain"
                  className="min-h-13 flex-1 rounded-xl border border-slate-800 bg-zinc-950 px-4 text-base text-slate-100 outline-none placeholder:text-slate-600 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20"
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="panel-subtle rounded-xl px-4 py-3 text-sm leading-6 text-slate-400">
                    Paste a raw domain or full URL. The analyzer will normalize it automatically.
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="min-h-13 rounded-xl border border-slate-700 bg-slate-100 px-6 text-sm font-semibold text-slate-950 shadow-sm hover:bg-white"
                  >
                    Analyze
                  </button>
                </div>
              </div>
              {error ? (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
            </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="panel-subtle rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    What it scores
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    TLD strength, length, brandability, memorability, pronounceability, premium brand signal, trend relevance, commercial intent, and risk penalties.
                  </p>
                </div>
                <div className="panel-subtle rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    What comes next
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    This model is intentionally lightweight and ready to be upgraded with registrar and ML data later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel rounded-3xl p-6">
            {result ? (
              <div className="space-y-6">
                <div className="border-b border-white/8 pb-6">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                        Analyzed domain
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold text-slate-50 sm:text-3xl">
                        {result.domain}
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                        A structured snapshot of resale quality, brand readiness, and current mocked availability.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm font-medium text-slate-200">
                          {result.verdict}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-medium ${labelForRisk(
                            result.riskLevel,
                          )}`}
                        >
                          Risk: {result.riskLevel}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-medium ${labelForAvailability(
                            result.availabilityStatus,
                          )}`}
                        >
                          {result.availabilityStatus}
                        </span>
                      </div>
                    </div>
                    <div className="panel-strong rounded-2xl px-5 py-5 text-center">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Score
                      </p>
                      <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-50">
                        {result.score}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">out of 100</p>
                      <div className="mt-4 h-2 rounded-full bg-white/6">
                        <div
                          className="h-2 rounded-full bg-slate-300/80"
                          style={{ width: `${Math.max(10, result.score)}%` }}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200">
                          Rule {result.ruleScore}
                        </div>
                        <div className="rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-1 text-sm font-medium text-sky-200">
                          Market {result.marketScore}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="panel-strong rounded-2xl p-4">
                    <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      TLD
                    </dt>
                    <dd className="mt-2 text-lg font-semibold text-slate-100">
                      .{result.tld}
                    </dd>
                  </div>
                  <div className="panel-strong rounded-2xl p-4">
                    <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      Name
                    </dt>
                    <dd className="mt-2 text-lg font-semibold text-slate-100">
                      {result.name}
                    </dd>
                  </div>
                  <div className="panel-strong rounded-2xl p-4">
                    <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      Name length
                    </dt>
                    <dd className="mt-2 text-lg font-semibold text-slate-100">
                      {result.name.length} characters
                    </dd>
                  </div>
                  <div className="panel-strong rounded-2xl p-4">
                    <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      Availability
                    </dt>
                    <dd className="mt-2 text-lg font-semibold text-slate-100">
                      {result.availabilityStatus}
                    </dd>
                  </div>
                  <div className="panel-strong rounded-2xl p-4">
                    <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      Estimated value
                    </dt>
                    <dd className="mt-2 text-lg font-semibold text-slate-100">
                      ${result.estimatedValueUsd?.toLocaleString?.() ?? result.estimatedValueUsd}
                    </dd>
                  </div>
                  <div className="panel-strong rounded-2xl p-4">
                    <dt className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                      Comparable sales
                    </dt>
                    <dd className="mt-2 text-lg font-semibold text-slate-100">
                      {result.marketData?.comparableSalesCount ?? result.comparableSalesCount ?? 0}
                    </dd>
                  </div>
                </dl>

                <section className="panel-strong rounded-2xl p-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Domain availability
                      </h3>
                      <div className="mt-3 flex items-center gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-medium ${labelForAvailability(
                            result.availabilityStatus,
                          )}`}
                        >
                          {result.availabilityStatus}
                        </span>
                      </div>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                        Availability checking is currently mocked for product-flow
                        purposes and will later be connected to a real domain
                        registrar or WHOIS API.
                      </p>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                        Market data is mocked in this MVP and structured for future integration with NameBio, GoDaddy GoValue, or registrar APIs.
                      </p>
                    </div>
                    {result.availabilityStatus === "Available" ? (
                      <button
                        type="button"
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 text-sm font-semibold text-emerald-200 hover:border-emerald-400/30 hover:bg-emerald-500/15"
                      >
                        Register domain
                      </button>
                    ) : result.availabilityStatus === "Taken" ? (
                      <button
                        type="button"
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-700 bg-zinc-950 px-5 text-sm font-semibold text-slate-100 hover:border-slate-500 hover:bg-zinc-900"
                      >
                        Notify when available
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 text-sm font-semibold text-amber-200 hover:border-amber-400/30 hover:bg-amber-500/15"
                      >
                        Check again later
                      </button>
                    )}
                  </div>
                </section>

                <section className="panel-strong rounded-2xl p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Score breakdown
                    </h3>
                    <p className="text-xs text-slate-500">
                      Positive categories add value. Risk penalties subtract from the final score.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {(Object.entries(result.breakdown || {}) as Array<[string, number]>).map(
                      ([key, value]) => {
                      const isPenalty = key === "riskPenalties";
                      const max = BREAKDOWN_MAX[key];
                      const width = Math.max(8, (value / max) * 100);

                      return (
                        <div
                          key={key}
                          className="panel-subtle rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-slate-200">
                                {BREAKDOWN_LABELS[key]}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {isPenalty ? "Deduction category" : "Positive scoring category"}
                              </p>
                            </div>
                            <p
                              className={`text-sm font-semibold ${
                                isPenalty ? "text-red-300" : "text-slate-100"
                              }`}
                            >
                              {isPenalty ? "-" : "+"}
                              {value}
                              <span className="ml-1 text-slate-500">/ {max}</span>
                            </p>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/6">
                            <div
                              className={`h-full rounded-full ${
                                isPenalty ? "bg-red-400/70" : "bg-slate-300/80"
                              }`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className="grid gap-4 xl:grid-cols-2">
                  <section className="panel-strong rounded-2xl p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Reasons
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                      {result.reasons.map((reason) => (
                        <li key={reason} className="border-b border-white/6 pb-3 last:border-b-0 last:pb-0">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="panel-strong rounded-2xl p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Weaknesses
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                      {result.weaknesses.length > 0 ? (
                        result.weaknesses.map((weakness) => (
                          <li key={weakness} className="border-b border-white/6 pb-3 last:border-b-0 last:pb-0">
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
            ) : (
              <div className="flex min-h-[720px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950/30 p-8 text-center">
                <div className="max-w-md">
                  <div className="mx-auto mb-6 grid w-full max-w-xs grid-cols-2 gap-3">
                    <div className="panel-subtle rounded-xl p-4 text-left">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Score</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-100">0-100</p>
                    </div>
                    <div className="panel-subtle rounded-xl p-4 text-left">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-100">Mocked</p>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    Analysis results will appear here
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Submit a domain to see its score, verdict, strengths, and
                    weaknesses.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
