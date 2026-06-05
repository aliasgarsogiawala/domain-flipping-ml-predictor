"use client";

import { useState } from "react";

type MarketAssistantResponse = {
  provider: "gemini" | "openai" | "fallback";
  model: string | null;
  answer: string;
  insights: string[];
  suggestedFilters: string[];
};

export default function MarketAiPanel() {
  const [question, setQuestion] = useState("Which categories are strongest under $5k?");
  const [result, setResult] = useState<MarketAssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAsk() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "market",
          question,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Unable to query market assistant.");
      }
      setResult(payload as MarketAssistantResponse);
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to query market assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel-white rounded-[30px] p-6">
      <div className="border-b border-black pb-4">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Ask AI Over Market Data</p>
        <h3 className="mt-2 text-2xl font-semibold text-black">Query the local dataset</h3>
      </div>

      <div className="mt-5 grid gap-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-h-[100px] w-full rounded-2xl border border-black bg-white px-4 py-3 text-base text-black outline-none"
        />
        <button
          type="button"
          onClick={handleAsk}
          disabled={loading}
          className="btn-lime inline-flex min-h-[48px] items-center justify-center rounded-full px-5 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Ask Market AI"}
        </button>
        {error ? (
          <div className="rounded-2xl border border-[#fca5a5]/40 bg-[#fff1f1] px-4 py-3 text-sm text-[#8b1f1f]">
            {error}
          </div>
        ) : null}
      </div>

      {result ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-[22px] border border-black bg-[#101726] px-4 py-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{result.answer}</p>
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
                {result.provider}{result.model ? ` · ${result.model}` : ""}
              </div>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[22px] border border-black bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Insights</p>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                {result.insights.map((item) => (
                  <div key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[22px] border border-black bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Suggested Filters</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.suggestedFilters.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black bg-[var(--lime)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-black"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
