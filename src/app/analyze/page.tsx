"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import DomainSignalRadarChart from "@/components/DomainSignalRadarChart";
import DomainTrendChart from "@/components/DomainTrendChart";
import DomainComparisonChart from "@/components/DomainComparisonChart";
import ValueProjectionChart from "@/components/ValueProjectionChart";
import { formatInrFromUsd } from "@/lib/currency";
import type { InvestmentReport } from "@/lib/investmentReport";
import type { ComparableSaleMatch } from "@/lib/marketData";
import type { MockMarketData } from "@/lib/mockMarketData";
import { addWatchedDomainRef } from "@/lib/convex";
import type { OpenAIDomainInsights } from "@/lib/openaiDomainAdvisor";
import type { RdapLookupResult } from "@/lib/rdap";
import type { ValueProjectionResult } from "@/lib/valueProjection";

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
  aiInitialEstimateUsd: number;
  mlPredictedValueUsd: number | null;
  mlPredictionConfidence: "Low" | "Medium" | "High" | null;
  modelAdjustedEstimatedValueUsd: number;
  tldMarketAnchorUsd: number;
  adjustedEstimatedValueUsd: number;
  liquidityScore: number;
  valuationBasis: {
    pricingConfidence: "Low" | "Medium" | "High";
    comparableSalesUsed: number;
    comparableMedianUsd: number | null;
    comparableWeightedMedianUsd: number | null;
    averageComparableSimilarity: number | null;
  };
  verdict: "Low Potential" | "Moderate Potential" | "High Potential" | "Premium Potential";
  riskLevel: "Low" | "Medium" | "High";
  reasons: string[];
  weaknesses: string[];
  marketData: MockMarketData;
  breakdown: Record<string, number>;
  comparableSalesCount: number;
  rdap: RdapLookupResult;
  comparableSales: ComparableSaleMatch[];
  marketplaceStatus?: string | null;
  marketplaceName?: string | null;
  askingPrice?: number | null;
  landingPageDetected?: boolean;
  marketplaceNotes?: string | null;
  resaleStatus?: "not_listed" | "listed_for_sale" | "possibly_listed" | "needs_verification" | "unknown";
  detectedMarketplace?: string | null;
  resaleConfidence?: "high" | "medium" | "low" | null;
  marketplaceLinks?: Record<string, string> | null;
  openaiInsights: OpenAIDomainInsights;
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

function badgeForAiConfidence(value: OpenAIDomainInsights["confidence"]) {
  if (value === "High") return "bg-[var(--lime)] text-black border-black";
  if (value === "Medium") return "bg-[var(--purple-bar)] text-black border-black";
  return "bg-white text-black border-black";
}

function aiProviderMeta(insights: OpenAIDomainInsights) {
  if (insights.provider === "gemini") {
    return {
      label: "Live AI",
      detail: insights.model ?? "Gemini",
      dot: "bg-[var(--success)]",
      className: "bg-black text-white border-black",
    };
  }
  return {
    label: "Heuristic engine",
    detail: "AI offline · deterministic fallback",
    dot: "bg-[var(--warning)]",
    className: "bg-white text-black border-black",
  };
}

function badgeForPricingConfidence(value: ApiResult["valuationBasis"]["pricingConfidence"]) {
  if (value === "High") return "bg-[var(--lime)] text-black border-black";
  if (value === "Medium") return "bg-[var(--purple-bar)] text-black border-black";
  return "bg-white text-black border-black";
}

function badgeForTrajectory(value: ValueProjectionResult["trajectory"]) {
  if (value === "Momentum Upside") return "bg-[var(--lime)] text-black border-black";
  if (value === "Gradual Upside") return "bg-[#ffd9b8] text-black border-black";
  if (value === "Flat") return "bg-white text-black border-black";
  return "bg-[#ffd3d3] text-black border-black";
}

function riskRank(value: ApiResult["riskLevel"]) {
  if (value === "Low") return 0;
  if (value === "Medium") return 1;
  return 2;
}

function ScoreRing({ score, verdict }: { score: number; verdict: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const stroke =
    clamped >= 70 ? "var(--lime)" : clamped >= 50 ? "var(--purple-bar)" : "#0f0f0f";

  return (
    <div className="flex items-center gap-4 rounded-[24px] border border-black bg-white px-5 py-4">
      <div className="relative h-[128px] w-[128px] shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(15,15,15,0.10)" strokeWidth="12" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="data-mono text-3xl font-bold leading-none text-black">{clamped}</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">/ 100</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Final Score</p>
        <p className="mt-2 text-lg font-semibold leading-tight text-black">{verdict}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Blended rule, market, brand, and ML signals.
        </p>
      </div>
    </div>
  );
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

function SignalMeter({
  label,
  value,
  hint,
  invert = false,
}: {
  label: string;
  value: number;
  hint?: string;
  invert?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  // For "good" signals high is positive; for risk (invert) high is negative.
  const positive = invert ? clamped < 45 : clamped >= 65;
  const caution = invert ? clamped >= 45 && clamped < 68 : clamped >= 45 && clamped < 65;
  const barColor = positive
    ? "bg-[var(--lime)]"
    : caution
      ? "bg-[var(--purple-bar)]"
      : "bg-black";

  return (
    <div className="rounded-2xl border border-black bg-white px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold text-black">{label}</p>
        <p className="data-mono text-sm font-bold text-black">
          {clamped}
          <span className="ml-0.5 text-slate-400">/100</span>
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${Math.max(4, clamped)}%` }} />
      </div>
      {hint ? <p className="mt-2 text-[11px] leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col items-start justify-between gap-2 rounded-2xl border border-black bg-white px-4 py-3 text-sm">
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

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seededDomain = searchParams.get("domain")?.trim() ?? "";
  const lastAutoAnalyzedRef = useRef<string | null>(null);
  const { isSignedIn } = useUser();
  const addWatchedDomain = useMutation(addWatchedDomainRef);
  const [input, setInput] = useState(seededDomain);
  const [compareInput, setCompareInput] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [compareResult, setCompareResult] = useState<ApiResult | null>(null);
  const [battleInput, setBattleInput] = useState("");
  const [battleResults, setBattleResults] = useState<ApiResult[]>([]);
  const [error, setError] = useState("");
  const [compareError, setCompareError] = useState("");
  const [battleError, setBattleError] = useState("");
  const [watchAdded, setWatchAdded] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [isBattleLoading, setIsBattleLoading] = useState(false);
  const [isSavingWatch, setIsSavingWatch] = useState(false);
  const [targetBuyPrice, setTargetBuyPrice] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [negotiationStance, setNegotiationStance] = useState("Disciplined");

  const runAnalyze = async (domainValue: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainValue }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Analysis failed");
      }
      const json: ApiResult = await res.json();
      setResult(json);
      setCompareResult(null);
      setBattleResults([]);
      setCompareError("");
      setBattleError("");
      setError("");
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to analyze that domain.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    await runAnalyze(input);
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

  const handleBattle = async () => {
    const domains = [...new Set(
      battleInput
        .split(/[\n,\s]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    )].slice(0, 5);

    if (domains.length < 3) {
      setBattleError("Enter 3 to 5 domains for battle mode.");
      return;
    }

    try {
      setIsBattleLoading(true);
      setBattleError("");
      const responses = await Promise.all(
        domains.map(async (domain) => {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          });
          if (!res.ok) {
            const payload = await res.json();
            throw new Error(payload?.error || `Unable to analyze ${domain}`);
          }
          return (await res.json()) as ApiResult;
        }),
      );
      setBattleResults(responses);
    } catch (caughtError) {
      setBattleResults([]);
      setBattleError(caughtError instanceof Error ? caughtError.message : "Unable to run battle mode.");
    } finally {
      setIsBattleLoading(false);
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

  const battleLeaders =
    battleResults.length >= 3
      ? {
          bestLiquidity: [...battleResults].sort((left, right) => right.liquidityScore - left.liquidityScore)[0],
          bestBrand: [...battleResults].sort((left, right) => right.brandPrestigeScore - left.brandPrestigeScore)[0],
          bestAcquisition: [...battleResults].sort((left, right) => riskRank(left.riskLevel) - riskRank(right.riskLevel) || left.adjustedEstimatedValueUsd - right.adjustedEstimatedValueUsd)[0],
        }
      : null;

  const numericTargetBuyPrice = targetBuyPrice ? Number(targetBuyPrice) : null;
  const numericMaxBudget = maxBudget ? Number(maxBudget) : null;
  const acquisitionReadiness =
    result && numericTargetBuyPrice
      ? numericTargetBuyPrice <= result.adjustedEstimatedValueUsd
        ? "Target price is disciplined relative to the current adjusted estimate."
        : "Target price is above the current adjusted estimate, so negotiation discipline matters."
      : "Set a target price and budget to frame the acquisition stance.";

  const handleWatchDomain = async () => {
    if (!result) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    try {
      setIsSavingWatch(true);
      await addWatchedDomain({
        domain: result.domain,
        score: result.score,
        availabilityStatus: result.availabilityStatus,
        resaleStatus: result.resaleStatus ?? null,
        estimatedValueUsd: result.adjustedEstimatedValueUsd ?? null,
        registrar: result.rdap?.registrar ?? null,
        expiresAt: result.rdap?.expiresAt ?? null,
        lastCheckedAt: new Date().toISOString(),
        targetBuyPriceUsd: targetBuyPrice ? Number(targetBuyPrice) : undefined,
        maxBudgetUsd: maxBudget ? Number(maxBudget) : undefined,
        negotiationStance,
      });
      setWatchAdded(result.domain);
      setTimeout(() => setWatchAdded(null), 2500);
    } finally {
      setIsSavingWatch(false);
    }
  };

  useEffect(() => {
    if (!seededDomain || seededDomain === lastAutoAnalyzedRef.current) return;
    lastAutoAnalyzedRef.current = seededDomain;
    void runAnalyze(seededDomain);
  }, [seededDomain]);

  return (
    <main className="page-wrap pb-20">
      <section className="panel-grid relative overflow-hidden rounded-[40px] border border-black bg-[#090b0f] px-6 py-12 text-white sm:px-12 lg:px-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative grid gap-8 xl:grid-cols-[500px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="panel-dark rounded-[30px] p-6">
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

            <div className="panel-dark rounded-[30px] p-6">
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

            <div className="panel-dark rounded-[30px] p-6">
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Domain Battle</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Compare 3-5 domains at once</h2>
              </div>

              <div className="mt-5 space-y-4">
                <textarea
                  value={battleInput}
                  onChange={(event) => setBattleInput(event.target.value)}
                  placeholder={"alphaagent.com\nsignalstack.ai\npaymint.io"}
                  className="data-mono min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-slate-100 outline-none placeholder:text-slate-500 focus:border-[var(--lime)] focus:ring-2 focus:ring-[var(--lime)]/20"
                />
                <button
                  type="button"
                  onClick={handleBattle}
                  disabled={isBattleLoading}
                  className="btn-ghost inline-flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-semibold disabled:opacity-60"
                >
                  {isBattleLoading ? "Running battle..." : "Run Domain Battle"}
                </button>
                {battleError ? (
                  <div className="rounded-2xl border border-[#fca5a5]/40 bg-[#2b1111] px-4 py-3 text-sm text-[#fecaca]">
                    {battleError}
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
              <h2 className="mt-5 max-w-4xl text-[2.4rem] font-semibold leading-[1.07] tracking-[-0.05em] sm:text-[3rem]">
                Technical, valuation, and acquisition signals in one domain research surface.
              </h2>
              <p className="mt-5 max-w-3xl text-[1.0625rem] leading-[1.8] text-slate-300">
                Built to feel like a serious domain intelligence desk: score layers, RDAP details, benchmarked valuation,
                resale posture, value projection, and deterministic recommendation output.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="panel-dark-soft min-w-0 rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Scoring stack</p>
                <p className="data-mono mt-3 break-words text-2xl font-semibold leading-tight text-white">10 signals</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">TLD strength, brandability, market posture, and penalties.</p>
              </div>
              <div className="panel-dark-soft min-w-0 rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Market anchors</p>
                <p className="data-mono mt-3 break-words text-2xl font-semibold leading-tight text-white">TLD median refs</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Curated benchmark values keep estimates believable.</p>
              </div>
              <div className="panel-dark-soft min-w-0 rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">RDAP visibility</p>
                <p className="data-mono mt-3 break-words text-2xl font-semibold leading-tight text-white">Registrar-first</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Lifecycle timing and ownership metadata where available.</p>
              </div>
              <div className="panel-dark-soft min-w-0 rounded-[24px] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Monitoring flow</p>
                <p className="data-mono mt-3 break-words text-2xl font-semibold leading-tight text-white">Watch ready</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Track taken assets and recheck them from the watchlist.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {result ? (
        <>
          <section className="mt-10 grid-paper rounded-[30px] border border-black p-4 sm:p-6">
            <div className="panel-white surface-ring rounded-[30px] p-6 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-black pb-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">Active Domain</p>
                  <h2 className="data-mono mt-2 text-3xl font-semibold text-black sm:text-4xl">{result.domain}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                    {result.investmentReport.summary}
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-3 sm:items-end">
                  <ScoreRing score={result.score} verdict={result.verdict} />
                  <div className="flex flex-wrap gap-3 sm:justify-end">
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
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Estimated Value"
                  value={formatInrFromUsd(result.adjustedEstimatedValueUsd)}
                  subtext={`Evidence-backed estimate · ${result.valuationBasis.pricingConfidence} confidence`}
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

          <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
            <div className="space-y-6">
              <SectionCard
                eyebrow="Value Projection"
                title="Projected scenario range"
                aside={
                  <div className="flex flex-wrap gap-2">
                    <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${badgeForTrajectory(result.valueProjection.trajectory)}`}>
                      {result.valueProjection.trajectory}
                    </div>
                    <div className="rounded-full border border-black bg-[var(--lime)] px-3 py-1 text-sm font-semibold text-black">
                      Confidence: {result.valueProjection.confidence}
                    </div>
                  </div>
                }
              >
                <div className="mb-5 grid gap-4 md:grid-cols-3">
                  <StatCard
                    label="3Y Expected Change"
                    value={`${result.valueProjection.expectedChangePercent > 0 ? "+" : ""}${result.valueProjection.expectedChangePercent}%`}
                    subtext="Expected change from the present estimate under the current signal mix."
                    mono
                  />
                  <StatCard
                    label="Outlook Score"
                    value={`${result.valueProjection.domainOutlookScore}`}
                    subtext="Composite forward-looking posture from ML, comparables, and AI helper signals."
                    mono
                  />
                  <StatCard
                    label="Projection Range"
                    value={formatInrFromUsd(result.valueProjection.points.at(-1)?.expected ?? result.adjustedEstimatedValueUsd)}
                    subtext={`3Y expected midpoint · low ${formatInrFromUsd(result.valueProjection.points.at(-1)?.low ?? result.adjustedEstimatedValueUsd)}`}
                    mono
                  />
                </div>
                <ValueProjectionChart projection={result.valueProjection} />
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Trend Drivers</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {result.valueProjection.trendDrivers.length ? (
                        result.valueProjection.trendDrivers.map((item) => (
                          <li key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                            {item}
                          </li>
                        ))
                      ) : (
                        <li>No strong upside drivers were detected beyond the current base value.</li>
                      )}
                    </ul>
                  </div>
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Projection Risks</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {result.valueProjection.riskDrivers.length ? (
                        result.valueProjection.riskDrivers.map((item) => (
                          <li key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                            {item}
                          </li>
                        ))
                      ) : (
                        <li>Downside pressure is limited relative to the current evidence set.</li>
                      )}
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  Projection is estimated from scoring signals, comparable-sale support, ML features, and AI market posture. It is not a guaranteed resale outcome.
                </p>
              </SectionCard>

              <SectionCard eyebrow="Trend Graphs" title="Domain-specific demand and signal posture">
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="panel-white-soft rounded-[24px] p-5">
                    <div className="border-b border-black pb-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Buyer Demand Over Time</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        A forward view of demand momentum and conviction based on current comps, AI demand scoring, and model confidence.
                      </p>
                    </div>
                    <div className="mt-4">
                      <DomainTrendChart projection={result.valueProjection} />
                    </div>
                  </div>
                  <div className="panel-white-soft rounded-[24px] p-5">
                    <div className="border-b border-black pb-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Signal Balance</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        Shows where this domain is strong right now across score quality, buyer demand, market posture, liquidity, and risk resistance.
                      </p>
                    </div>
                    <div className="mt-4">
                      <DomainSignalRadarChart
                        domain={result.domain}
                        score={result.score}
                        investmentScore={result.investmentScore}
                        brandPrestigeScore={result.brandPrestigeScore}
                        marketScore={result.marketScore}
                        liquidityScore={result.liquidityScore}
                        riskLevel={result.riskLevel}
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="AI Advisory"
                title="AI-assisted market summary"
                aside={
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${aiProviderMeta(result.openaiInsights).className}`}>
                      <span className={`h-2 w-2 rounded-full ${aiProviderMeta(result.openaiInsights).dot}`} />
                      {aiProviderMeta(result.openaiInsights).label}
                    </span>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeForAiConfidence(result.openaiInsights.confidence)}`}>
                      AI confidence: {result.openaiInsights.confidence}
                    </span>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeForRecommendation(result.openaiInsights.suggestedRecommendation)}`}>
                      AI suggestion: {result.openaiInsights.suggestedRecommendation}
                    </span>
                  </div>
                }
              >
                <div className="mb-5 panel-white-soft rounded-[22px] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">AI Signal Scores</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="data-mono text-[11px] text-slate-500">{aiProviderMeta(result.openaiInsights).detail}</span>
                      {result.openaiInsights.eliteWordSignal ? (
                        <span className="inline-flex rounded-full border border-black bg-[var(--lime)] px-2.5 py-1 text-[11px] font-semibold text-black">
                          Elite-word signal
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-black bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          No elite-word signal
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SignalMeter
                      label="Premium Feel"
                      value={result.openaiInsights.premiumFeelScore}
                      hint="How elite and broadly desirable the name reads."
                    />
                    <SignalMeter
                      label="End-User Demand"
                      value={result.openaiInsights.endUserDemandScore}
                      hint="Likelihood real businesses would want this name."
                    />
                    <SignalMeter
                      label="Aftermarket Strength"
                      value={result.openaiInsights.aftermarketStrengthScore}
                      hint="Resale liquidity based on comps and category."
                    />
                    <SignalMeter
                      label="Negotiation Risk"
                      value={result.openaiInsights.negotiationRiskScore}
                      hint="Lower is better. Friction to acquire the name."
                      invert
                    />
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">AI Summary</p>
                    <p className="mt-4 text-sm leading-7 text-slate-700">{result.openaiInsights.summary}</p>
                  </div>
                  <div className="grid gap-4">
                    <div className="panel-white-soft rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Valuation Rationale</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{result.openaiInsights.valuationRationale}</p>
                    </div>
                    <div className="panel-white-soft rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Decision Guidance</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{result.openaiInsights.decisionGuidance}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Acquisition Suggestions</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {result.openaiInsights.acquisitionSuggestions.map((item) => (
                        <li key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Risk Flags</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {result.openaiInsights.riskFlags.map((item) => (
                        <li key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Buyer Angles</p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {result.openaiInsights.buyerAngles.map((item) => (
                        <li key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Similar Domains</p>
                      <p className="data-mono text-xs text-slate-500">
                        AI value adj: {result.openaiInsights.valueAdjustmentPercent > 0 ? "+" : ""}
                        {result.openaiInsights.valueAdjustmentPercent}%
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.openaiInsights.similarDomains.map((domain) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => {
                            setInput(domain);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="data-mono rounded-full border border-black bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-[var(--lime)]"
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      Similar domains are idea prompts for further screening, not availability guarantees.
                    </p>
                  </div>
                </div>
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

              {battleResults.length >= 3 ? (
                <SectionCard eyebrow="Battle Mode" title="3-5 domain tournament">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="panel-white-soft rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Liquidity leader</p>
                      <p className="data-mono mt-3 text-lg font-semibold text-black">{battleLeaders?.bestLiquidity.domain}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">Highest liquidity score in the battle set.</p>
                    </div>
                    <div className="panel-white-soft rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Brand leader</p>
                      <p className="data-mono mt-3 text-lg font-semibold text-black">{battleLeaders?.bestBrand.domain}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">Strongest brand prestige among the compared names.</p>
                    </div>
                    <div className="panel-white-soft rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Acquisition leader</p>
                      <p className="data-mono mt-3 text-lg font-semibold text-black">{battleLeaders?.bestAcquisition.domain}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">Best risk-to-value profile for disciplined buying.</p>
                    </div>
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-[24px] border border-black bg-white">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="border-b border-black text-xs uppercase tracking-[0.18em] text-slate-600">
                          <th className="px-4 py-3 font-medium">Domain</th>
                          <th className="px-4 py-3 font-medium">Score</th>
                          <th className="px-4 py-3 font-medium">Brand</th>
                          <th className="px-4 py-3 font-medium">Liquidity</th>
                          <th className="px-4 py-3 font-medium">Value</th>
                          <th className="px-4 py-3 font-medium">Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {battleResults
                          .slice()
                          .sort((left, right) => right.score - left.score)
                          .map((item) => (
                            <tr key={item.domain} className="border-b border-black/10 text-sm last:border-b-0">
                              <td className="data-mono px-4 py-4 font-medium text-black">{item.domain}</td>
                              <td className="data-mono px-4 py-4 text-slate-700">{item.score}</td>
                              <td className="data-mono px-4 py-4 text-slate-700">{item.brandPrestigeScore}</td>
                              <td className="data-mono px-4 py-4 text-slate-700">{item.liquidityScore}</td>
                              <td className="data-mono px-4 py-4 text-slate-700">{formatInrFromUsd(item.adjustedEstimatedValueUsd)}</td>
                              <td className="px-4 py-4 text-slate-700">{item.riskLevel}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
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

              <SectionCard eyebrow="Valuation Layer" title="How the estimate is built">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${badgeForPricingConfidence(result.valuationBasis.pricingConfidence)}`}>
                    Pricing confidence: {result.valuationBasis.pricingConfidence}
                  </span>
                  <span className="inline-flex rounded-full border border-black bg-white px-3 py-1 text-sm font-semibold text-black">
                    {result.valuationBasis.comparableSalesUsed} comparable
                    {result.valuationBasis.comparableSalesUsed === 1 ? "" : "s"}
                  </span>
                  {result.valuationBasis.averageComparableSimilarity ? (
                    <span className="inline-flex rounded-full border border-black bg-white px-3 py-1 text-sm font-semibold text-black">
                      Avg similarity {result.valuationBasis.averageComparableSimilarity}/100
                    </span>
                  ) : null}
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div className="panel-white-soft min-w-0 rounded-[20px] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Estimated Value</p>
                    <p className="data-mono mt-3 break-words text-xl font-semibold leading-tight text-black">
                      {formatInrFromUsd(result.adjustedEstimatedValueUsd)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Final blended estimate after ML, comparable, and risk-aware adjustments.
                    </p>
                  </div>
                  <div className="panel-white-soft min-w-0 rounded-[20px] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">TLD Benchmark</p>
                    <p className="data-mono mt-3 break-words text-xl font-semibold leading-tight text-black">
                      {formatInrFromUsd(result.tldMarketAnchorUsd)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Reference median for this extension, not a guaranteed clearing price.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <DetailRow label="Estimated value" value={formatInrFromUsd(result.adjustedEstimatedValueUsd)} mono />
                  <DetailRow label="Model-adjusted value" value={formatInrFromUsd(result.modelAdjustedEstimatedValueUsd)} mono />
                  <DetailRow label="ML reference" value={formatInrFromUsd(result.mlPredictedValueUsd)} mono />
                  <DetailRow label="ML confidence" value={result.mlPredictionConfidence ?? "Not available"} />
                  <DetailRow label="AI confidence" value={result.openaiInsights.confidence} />
                  <DetailRow label="TLD market benchmark" value={formatInrFromUsd(result.tldMarketAnchorUsd)} mono />
                  <DetailRow label="Liquidity score" value={`${result.liquidityScore}`} mono />
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  The estimate blends the ML baseline, the nearest comparable sales, and the TLD benchmark, with risk-aware caps. When comparable support is weak, the estimate stays close to conservative reference values rather than chasing outliers.
                </p>
              </SectionCard>

              <SectionCard eyebrow="Comparable Sales" title="Nearest observed sale references">
                {result.comparableSales.length ? (
                  <div className="space-y-3">
                    {result.comparableSales.map((sale, index) => (
                      <div
                        key={`${sale.domain}-${sale.salePriceUsd}-${sale.saleDate ?? "na"}-${sale.venue ?? "na"}-${index}`}
                        className="rounded-[22px] border border-black bg-white px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="data-mono text-lg font-semibold text-black">{sale.domain}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {sale.tld} · {sale.category} · {sale.charLength ?? "-"} chars · {sale.venue}
                            </p>
                            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                              {sale.matchReasons.join(" • ")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="data-mono text-lg font-semibold text-black">{formatInrFromUsd(sale.salePriceUsd)}</p>
                            <p className="mt-1 text-sm text-slate-600">{formatDate(sale.saleDate)}</p>
                            <p className="mt-1 text-xs text-slate-500">Similarity {sale.similarityScore}/100</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[22px] border border-black bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                    No close historical matches were found in the local sales dataset for this domain shape.
                  </div>
                )}
              </SectionCard>

              <SectionCard eyebrow="Acquisition Workflow" title="Turn analysis into a buying stance">
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Target buy price (USD)</label>
                      <input
                        value={targetBuyPrice}
                        onChange={(event) => setTargetBuyPrice(event.target.value)}
                        placeholder="50"
                        className="data-mono mt-2 min-h-[48px] w-full rounded-2xl border border-black bg-white px-4 text-base text-black outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Max budget (USD)</label>
                      <input
                        value={maxBudget}
                        onChange={(event) => setMaxBudget(event.target.value)}
                        placeholder="100"
                        className="data-mono mt-2 min-h-[48px] w-full rounded-2xl border border-black bg-white px-4 text-base text-black outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Negotiation stance</label>
                    <select
                      value={negotiationStance}
                      onChange={(event) => setNegotiationStance(event.target.value)}
                      className="mt-2 min-h-[48px] w-full rounded-2xl border border-black bg-white px-4 text-base text-black outline-none"
                    >
                      <option>Disciplined</option>
                      <option>Opportunistic</option>
                      <option>Aggressive</option>
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <DetailRow label="Target buy price" value={numericTargetBuyPrice ? formatInrFromUsd(numericTargetBuyPrice) : "Not set"} mono />
                    <DetailRow label="Max budget" value={numericMaxBudget ? formatInrFromUsd(numericMaxBudget) : "Not set"} mono />
                    <DetailRow label="Negotiation stance" value={negotiationStance} />
                  </div>
                  <div className="rounded-[22px] border border-black bg-[var(--lime)] px-4 py-4 text-sm leading-7 text-black">
                    {acquisitionReadiness}
                  </div>
                </div>
              </SectionCard>

              <SectionCard eyebrow="Market Posture" title="Resale and listing context">
                <div className="grid gap-3">
                  <DetailRow label="Comparable sale count" value={`${result.comparableSalesCount}`} mono />
                  <DetailRow label="Market score" value={`${result.marketScore}`} mono />
                  <DetailRow label="Resale status" value={titleCaseLabel(result.resaleStatus)} />
                  <DetailRow label="Marketplace" value={result.detectedMarketplace ?? "Not detected"} />
                  <DetailRow label="Asking price" value={formatInrFromUsd(result.askingPrice)} mono />
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
                      onClick={handleWatchDomain}
                      className="btn-ghost inline-flex min-h-[52px] w-full items-center justify-center rounded-full text-sm font-semibold"
                    >
                      {isSavingWatch
                        ? "Saving..."
                        : watchAdded === result.domain
                          ? "Added To Watchlist"
                          : "Notify When Available"}
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

export default function AnalyzePage() {
  return (
    <Suspense fallback={null}>
      <AnalyzeContent />
    </Suspense>
  );
}
