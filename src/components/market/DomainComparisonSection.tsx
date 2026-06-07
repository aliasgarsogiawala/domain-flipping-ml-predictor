"use client";

import { useState } from "react";

type CompareResult = {
  domain: string;
  score: number;
  investmentScore: number;
  brandPrestigeScore: number;
  marketScore: number;
  liquidityScore: number;
  adjustedEstimatedValueUsd: number;
  riskLevel: "Low" | "Medium" | "High";
  verdict: string;
  availabilityStatus: "Available" | "Taken" | "Unknown";
  investmentReport: { recommendation: "Buy" | "Watch" | "Avoid" };
  tld: string;
  name: string;
};

function formatUsd(value: number) {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toLocaleString()}`;
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2.5 w-full rounded-full bg-black/8">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function riskColor(level: "Low" | "Medium" | "High") {
  return level === "Low" ? "#22c55e" : level === "Medium" ? "#f59e0b" : "#ef4444";
}

function recBadge(rec: "Buy" | "Watch" | "Avoid") {
  if (rec === "Buy") return "bg-[var(--lime)] text-black border-black";
  if (rec === "Watch") return "bg-[var(--purple-bar)] text-black border-black";
  return "bg-white text-black border-black";
}

const DOMAIN_COLORS = ["#f48120", "#7888ee", "#22c55e", "#3b82f6"];

export default function DomainComparisonSection() {
  const [inputs, setInputs] = useState(["", "", ""]);
  const [results, setResults] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addSlot = () => {
    if (inputs.length < 4) setInputs((prev) => [...prev, ""]);
  };

  const removeSlot = (index: number) => {
    if (inputs.length <= 2) return;
    setInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInput = (index: number, value: string) => {
    setInputs((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const runComparison = async () => {
    const domains = [...new Set(
      inputs.map((v) => v.trim().toLowerCase()).filter(Boolean),
    )];
    if (domains.length < 2) {
      setError("Enter at least 2 domains to compare.");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const fetched = await Promise.all(
        domains.map(async (domain) => {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          });
          if (!res.ok) {
            const payload = await res.json();
            throw new Error(payload?.error || `Failed to analyze ${domain}`);
          }
          return (await res.json()) as CompareResult;
        }),
      );
      setResults(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...results].sort((a, b) => b.score - a.score);
  const leader = sorted[0];

  const metrics: { label: string; key: keyof CompareResult; max: number; colorIndex?: number }[] = [
    { label: "Overall Score", key: "score", max: 100 },
    { label: "Investment Score", key: "investmentScore", max: 100 },
    { label: "Brand Prestige", key: "brandPrestigeScore", max: 100 },
    { label: "Market Score", key: "marketScore", max: 100 },
    { label: "Liquidity Score", key: "liquidityScore", max: 100 },
  ];

  return (
    <section className="mt-8 panel-white surface-ring rounded-[32px] p-6 sm:p-8">
      <div className="flex flex-col gap-2 border-b border-black pb-5">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Domain Comparison Lab</p>
        <h2 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.04em] text-black">
          Compare domains side-by-side
        </h2>
        <p className="max-w-2xl text-[0.9375rem] leading-[1.8] text-slate-600">
          Enter 2 to 4 domains to run a live analysis comparison. Scores, valuations, risk levels, and recommendation badges are all surfaced side-by-side so the strongest candidate is immediately obvious.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {inputs.map((value, index) => (
          <div key={index} className="relative">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Domain {index + 1}
              </label>
              {inputs.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeSlot(index)}
                  className="text-xs text-slate-400 hover:text-black"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: DOMAIN_COLORS[index] }}
              />
              <input
                value={value}
                onChange={(e) => updateInput(index, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runComparison(); }}
                placeholder={`domain${index + 1}.com`}
                className="data-mono min-h-[48px] w-full rounded-2xl border border-black bg-white px-4 text-[0.9375rem] text-black outline-none placeholder:text-slate-400 focus:border-[var(--lime)] focus:ring-2 focus:ring-[var(--lime)]/20"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runComparison}
          disabled={loading}
          className="btn-lime inline-flex min-h-[48px] items-center justify-center rounded-full px-7 text-[0.9375rem] font-semibold disabled:opacity-60"
        >
          {loading ? "Comparing..." : "Compare Domains"}
        </button>
        {inputs.length < 4 && (
          <button
            type="button"
            onClick={addSlot}
            className="btn-ghost inline-flex min-h-[48px] items-center justify-center rounded-full px-5 text-[0.9375rem] font-semibold"
          >
            + Add domain
          </button>
        )}
        {results.length > 0 && (
          <button
            type="button"
            onClick={() => { setResults([]); setInputs(["", "", ""]); }}
            className="text-sm text-slate-500 hover:text-black underline"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-[#fca5a5]/40 bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </div>
      )}

      {results.length >= 2 && (
        <div className="mt-8 space-y-8">
          <div className="rounded-[28px] border border-black bg-[var(--lime)] px-5 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700">Winner</p>
            <p className="data-mono mt-2 text-[1.5rem] font-semibold text-black">{leader.domain}</p>
            <p className="mt-1 text-sm text-slate-800">
              Highest overall score ({leader.score}/100) · {leader.verdict} · Recommendation: {leader.investmentReport.recommendation}
            </p>
          </div>

          <div className="overflow-x-auto rounded-[24px] border border-black bg-white">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-black bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-5 py-3 font-semibold">Metric</th>
                  {sorted.map((r, i) => (
                    <th key={r.domain} className="px-5 py-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: DOMAIN_COLORS[results.findIndex((x) => x.domain === r.domain)] }} />
                        <span className="data-mono text-black">{r.domain}</span>
                        {i === 0 && (
                          <span className="rounded-full border border-black bg-[var(--lime)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                            Best
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(({ label, key, max }) => {
                  const values = sorted.map((r) => r[key] as number);
                  const best = Math.max(...values);
                  return (
                    <tr key={key} className="border-b border-black/8 last:border-b-0">
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">{label}</td>
                      {sorted.map((r) => {
                        const v = r[key] as number;
                        return (
                          <td key={r.domain} className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-20 shrink-0">
                                <ScoreBar
                                  value={v}
                                  max={max}
                                  color={v === best ? "#f48120" : "#7888ee"}
                                />
                              </div>
                              <span className={`data-mono text-sm font-semibold ${v === best ? "text-black" : "text-slate-500"}`}>
                                {v}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr className="border-b border-black/8">
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">Estimated Value</td>
                  {sorted.map((r) => (
                    <td key={r.domain} className="px-5 py-4">
                      <span className="data-mono text-sm font-semibold text-black">
                        {formatUsd(r.adjustedEstimatedValueUsd)}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-black/8">
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">Risk Level</td>
                  {sorted.map((r) => (
                    <td key={r.domain} className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1 text-sm font-semibold"
                        style={{ color: riskColor(r.riskLevel) }}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: riskColor(r.riskLevel) }}
                        />
                        {r.riskLevel}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-black/8">
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">Availability</td>
                  {sorted.map((r) => (
                    <td key={r.domain} className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        r.availabilityStatus === "Available"
                          ? "bg-[var(--lime)] text-black border-black"
                          : r.availabilityStatus === "Taken"
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-black"
                      }`}>
                        {r.availabilityStatus}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-4 text-sm font-medium text-slate-700">Recommendation</td>
                  {sorted.map((r) => (
                    <td key={r.domain} className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${recBadge(r.investmentReport.recommendation)}`}>
                        {r.investmentReport.recommendation}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sorted.map((r, i) => (
              <div
                key={r.domain}
                className={`rounded-[24px] border border-black p-5 ${i === 0 ? "bg-[var(--lime)]" : "bg-white"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="h-3 w-3 shrink-0 mt-0.5 rounded-full"
                    style={{ background: DOMAIN_COLORS[results.findIndex((x) => x.domain === r.domain)] }}
                  />
                  <div className="flex-1">
                    <p className="data-mono text-base font-semibold text-black">{r.domain}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">{r.verdict}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${recBadge(r.investmentReport.recommendation)}`}>
                    {r.investmentReport.recommendation}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Score</span>
                    <span className="data-mono font-semibold text-black">{r.score}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Value</span>
                    <span className="data-mono font-semibold text-black">{formatUsd(r.adjustedEstimatedValueUsd)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Risk</span>
                    <span className="font-semibold" style={{ color: riskColor(r.riskLevel) }}>{r.riskLevel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
