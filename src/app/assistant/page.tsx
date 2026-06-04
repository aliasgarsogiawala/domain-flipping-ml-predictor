"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { addWatchedDomainRef } from "@/lib/convex";
import type {
  AssistantAnalysisContext,
  AssistantChatMessage,
  AssistantChatResponse,
  DomainIdeaBrief,
  DomainIdeaResponse,
  DomainIdeaSuggestion,
} from "@/lib/domainAssistant";

const CHAT_STORAGE_KEY = "domainflip-assistant-history-v1";
const IDEA_STORAGE_KEY = "domainflip-assistant-brief-v1";
const persistentSnapshotCache = new Map<string, { raw: string | null; parsed: unknown }>();

type StoredChatMessage = AssistantChatMessage & {
  id: string;
};

type AnalyzeApiResponse = {
  domain: string;
  score: number;
  adjustedEstimatedValueUsd: number;
  riskLevel: "Low" | "Medium" | "High";
  verdict: string;
  availabilityStatus: "Available" | "Taken" | "Unknown";
  resaleStatus?: string | null;
  reasons: string[];
  weaknesses: string[];
  tld: string;
  liquidityScore?: number;
};

const DEFAULT_BRIEF: DomainIdeaBrief = {
  budgetUsd: 2500,
  niche: "AI productivity",
  keywords: ["agent", "workflow", "automation"],
  preferredTlds: [".com", ".ai"],
  brandStyle: "Brandable",
  riskTolerance: "Medium",
  notes: "",
};

function subscribePersistent(key: string, callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    if (event instanceof StorageEvent) {
      if (event.key === key) callback();
      return;
    }

    const customEvent = event as CustomEvent<string>;
    if (customEvent.detail === key) {
      callback();
    }
  };

  window.addEventListener("storage", handler);
  window.addEventListener("domainflip-storage", handler as EventListener);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("domainflip-storage", handler as EventListener);
  };
}

function readPersistentValue<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const cached = persistentSnapshotCache.get(key);

    if (cached && cached.raw === raw) {
      return cached.parsed as T;
    }

    const parsed = raw ? (JSON.parse(raw) as T) : fallback;
    persistentSnapshotCache.set(key, { raw, parsed });
    return parsed;
  } catch {
    return fallback;
  }
}

function writePersistentValue<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(value);
  window.localStorage.setItem(key, raw);
  persistentSnapshotCache.set(key, { raw, parsed: value });
  window.dispatchEvent(new CustomEvent("domainflip-storage", { detail: key }));
}

function usePersistentJsonState<T>(key: string, fallback: T) {
  const snapshot = useSyncExternalStore(
    (callback) => subscribePersistent(key, callback),
    () => readPersistentValue(key, fallback),
    () => fallback,
  );

  const setSnapshot = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = readPersistentValue(key, fallback);
      const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
      writePersistentValue(key, resolved);
    },
    [fallback, key],
  );

  return [snapshot, setSnapshot] as const;
}

function extractDomains(input: string) {
  const matches = input.toLowerCase().match(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\b/g);
  return [...new Set(matches ?? [])];
}

function formatCurrency(value: number | null | undefined) {
  if (!value && value !== 0) return "Not set";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function Panel({
  eyebrow,
  title,
  children,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-[28px] border p-6 sm:p-7 ${
        dark ? "border-white/10 bg-[#111318] text-white" : "border-black panel-white"
      }`}
    >
      <div className={`border-b pb-4 ${dark ? "border-white/10" : "border-black"}`}>
        <p className={`text-xs font-medium uppercase tracking-[0.18em] ${dark ? "text-slate-400" : "text-slate-600"}`}>
          {eyebrow}
        </p>
        <h2 className={`mt-2 text-2xl font-semibold ${dark ? "text-white" : "text-black"}`}>{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function AssistantPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const addWatchedDomain = useMutation(addWatchedDomainRef);

  const [brief, setBrief] = usePersistentJsonState<DomainIdeaBrief>(IDEA_STORAGE_KEY, DEFAULT_BRIEF);
  const [ideaResult, setIdeaResult] = useState<DomainIdeaResponse | null>(null);
  const [chatHistory, setChatHistory] = usePersistentJsonState<StoredChatMessage[]>(CHAT_STORAGE_KEY, []);
  const [message, setMessage] = useState("");
  const [chatReply, setChatReply] = useState<AssistantChatResponse | null>(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");
  const [savedDomain, setSavedDomain] = useState<string | null>(null);

  async function fetchAnalysisContext(domain: string): Promise<AssistantAnalysisContext | null> {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });

    if (!res.ok) return null;

    const payload = (await res.json()) as AnalyzeApiResponse;
    return {
      domain: payload.domain,
      score: payload.score,
      adjustedEstimatedValueUsd: payload.adjustedEstimatedValueUsd,
      riskLevel: payload.riskLevel,
      verdict: payload.verdict,
      availabilityStatus: payload.availabilityStatus,
      resaleStatus: payload.resaleStatus ?? null,
      reasons: payload.reasons,
      weaknesses: payload.weaknesses,
      tld: payload.tld,
      liquidityScore: payload.liquidityScore,
    };
  }

  async function handleGenerateIdeas() {
    try {
      setLoadingIdeas(true);
      setError("");
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          brief,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Unable to generate ideas.");
      }
      setIdeaResult(payload as DomainIdeaResponse);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to generate ideas.");
    } finally {
      setLoadingIdeas(false);
    }
  }

  async function handleSendMessage() {
    if (!message.trim()) return;

    const userMessage = message.trim();
    const nextHistory: StoredChatMessage[] = [
      ...chatHistory,
      { id: `${Date.now()}-user`, role: "user", content: userMessage },
    ];
    setChatHistory(nextHistory);
    setMessage("");
    setLoadingChat(true);
    setError("");

    try {
      const domains = extractDomains(userMessage);
      const analysisContext = domains.length ? await fetchAnalysisContext(domains[0]) : null;

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          message: userMessage,
          history: nextHistory.map(({ role, content }) => ({ role, content })),
          analysisContext,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Unable to get assistant response.");
      }

      const reply = payload as AssistantChatResponse;
      setChatReply(reply);
      setChatHistory((current) => [
        ...current.slice(-19),
        { id: `${Date.now()}-assistant`, role: "assistant", content: reply.response },
      ]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to get assistant response.");
    } finally {
      setLoadingChat(false);
    }
  }

  async function handleSaveIdea(domain: string, suggestion: DomainIdeaSuggestion) {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    await addWatchedDomain({
      domain,
      score: suggestion.scoreHint,
      estimatedValueUsd: suggestion.indicativeValueUsd,
      availabilityStatus: "Unknown",
      resaleStatus: "idea_candidate",
      lastCheckedAt: new Date().toISOString(),
    });

    setSavedDomain(domain);
    setTimeout(() => setSavedDomain(null), 2200);
  }

  function updateBrief<K extends keyof DomainIdeaBrief>(key: K, value: DomainIdeaBrief[K]) {
    setBrief((current) => ({ ...current, [key]: value }));
  }

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
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
              AI sourcing copilot
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Source domain ideas, ask acquisition questions, and turn AI suggestions into actionable research.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
              Give the assistant a budget, keywords, and brand direction, or ask whether a specific domain is worth buying.
              It uses your existing scoring engine, market snapshot, and OpenAI layer to stay grounded.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            {[
              ["Idea Generation", "Budget, keywords, TLDs, and naming style become AI-backed sourcing ideas."],
              ["Grounded Chat", "Ask if a domain is worth buying and get a market-aware verdict."],
              ["One-Click Flow", "Save ideas to the watchlist or jump straight into the analyzer."],
            ].map(([label, text]) => (
              <div key={label} className="rounded-[24px] border border-white/10 bg-[#101726] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-8 rounded-2xl border border-[#fca5a5]/40 bg-[#2b1111] px-4 py-3 text-sm text-[#fecaca]">
          {error}
        </div>
      ) : null}

      <section className="mt-10 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel eyebrow="Phase 1" title="Domain idea generator" dark>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Budget</label>
                <input
                  value={brief.budgetUsd ?? ""}
                  onChange={(event) => updateBrief("budgetUsd", event.target.value ? Number(event.target.value) : null)}
                  placeholder="2500"
                  className="data-mono mt-2 min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Niche</label>
                <input
                  value={brief.niche}
                  onChange={(event) => updateBrief("niche", event.target.value)}
                  placeholder="AI productivity"
                  className="mt-2 min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Keywords</label>
                <input
                  value={brief.keywords.join(", ")}
                  onChange={(event) =>
                    updateBrief(
                      "keywords",
                      event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                    )
                  }
                  placeholder="agent, workflow, automation"
                  className="mt-2 min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Preferred TLDs</label>
                <input
                  value={brief.preferredTlds.join(", ")}
                  onChange={(event) =>
                    updateBrief(
                      "preferredTlds",
                      event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((item) => (item.startsWith(".") ? item : `.${item}`)),
                    )
                  }
                  placeholder=".com, .ai"
                  className="data-mono mt-2 min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Brand style</label>
                  <select
                    value={brief.brandStyle}
                    onChange={(event) => updateBrief("brandStyle", event.target.value)}
                    className="mt-2 min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base text-slate-100 outline-none"
                  >
                    <option>Brandable</option>
                    <option>Premium</option>
                    <option>Exact Match</option>
                    <option>Startup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Risk tolerance</label>
                  <select
                    value={brief.riskTolerance}
                    onChange={(event) => updateBrief("riskTolerance", event.target.value as DomainIdeaBrief["riskTolerance"])}
                    className="mt-2 min-h-[48px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base text-slate-100 outline-none"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Notes</label>
                <textarea
                  value={brief.notes ?? ""}
                  onChange={(event) => updateBrief("notes", event.target.value)}
                  placeholder="Prefer names that feel premium but still startup-friendly."
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-base text-slate-100 outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                type="button"
                onClick={handleGenerateIdeas}
                disabled={loadingIdeas}
                className="btn-lime inline-flex min-h-[52px] items-center justify-center rounded-full text-sm font-semibold disabled:opacity-60"
              >
                {loadingIdeas ? "Generating..." : "Generate Domain Ideas"}
              </button>
            </div>
          </Panel>

          <Panel eyebrow="Phase 3" title="Future enhancements">
            <div className="space-y-3 text-sm leading-7 text-slate-700">
              <p>Fine-tuned recommendation models trained on your own domain sales and acquisition outcomes.</p>
              <p>Semantic retrieval of similar sold domains from the local dataset and future live feeds.</p>
              <p>Portfolio-wide copilot that spots expiring opportunities, price shifts, and stronger alternatives automatically.</p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel eyebrow="Generated Ideas" title="Suggested domains">
            {ideaResult ? (
              <>
                <div className="rounded-[22px] border border-black bg-[var(--lime)] px-4 py-4">
                  <p className="text-sm font-semibold text-black">{ideaResult.overview}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-800">{ideaResult.marketNote}</p>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  {ideaResult.suggestions.map((suggestion) => (
                    <article key={suggestion.domain} className="panel-white-soft rounded-[22px] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="data-mono text-xl font-semibold text-black">{suggestion.domain}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-700">{suggestion.rationale}</p>
                        </div>
                        <div className="rounded-full border border-black bg-white px-3 py-1 text-sm font-semibold text-black">
                          {suggestion.scoreHint}/100
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3">
                        <div className="rounded-2xl border border-black bg-white px-4 py-3 text-sm text-slate-700">
                          <span className="font-semibold text-black">Buyer fit:</span> {suggestion.buyerAngle}
                        </div>
                        <div className="rounded-2xl border border-black bg-white px-4 py-3 text-sm text-slate-700">
                          <span className="font-semibold text-black">Risk note:</span> {suggestion.riskNote}
                        </div>
                        <div className="data-mono rounded-2xl border border-black bg-white px-4 py-3 text-sm text-black">
                          Indicative value: {formatCurrency(suggestion.indicativeValueUsd)}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={`/analyze?domain=${encodeURIComponent(suggestion.domain)}`} className="btn-lime inline-flex rounded-full px-4 py-2 text-sm font-semibold">
                          Analyze This Domain
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleSaveIdea(suggestion.domain, suggestion)}
                          className="btn-ghost inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                        >
                          {savedDomain === suggestion.domain ? "Saved" : "Save To Watchlist"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-[22px] border border-black bg-white px-5 py-8 text-sm leading-7 text-slate-700">
                Generate a brief on the left to get AI-backed domain suggestions with rationale, buyer fit, risk notes, and direct analyze actions.
              </div>
            )}
          </Panel>

          <Panel eyebrow="Phase 1 + 2" title="Ask AI about any domain">
            <div className="space-y-4">
              <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-[22px] border border-black bg-white p-4">
                {chatHistory.length === 0 ? (
                  <p className="text-sm leading-7 text-slate-700">
                    Ask things like “Is primeagent.ai worth buying at $2,500?”, “Give me .ai alternatives under $3k”, or “Which is better for resale: agentvault.com or agentgrid.ai?”
                  </p>
                ) : (
                  chatHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
                        item.role === "assistant" ? "border border-black bg-white text-slate-700" : "bg-[#101726] text-slate-100"
                      }`}
                    >
                      <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em]">
                        {item.role === "assistant" ? "Assistant" : "You"}
                      </p>
                      <p>{item.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="grid gap-3">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ask if a domain is worth buying, ask for alternatives, or request a sourcing angle."
                  className="min-h-[120px] w-full rounded-2xl border border-black bg-white px-4 py-3 text-base text-black outline-none placeholder:text-slate-500"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={loadingChat}
                    className="btn-lime inline-flex min-h-[48px] items-center justify-center rounded-full px-5 text-sm font-semibold disabled:opacity-60"
                  >
                    {loadingChat ? "Thinking..." : "Send To AI Copilot"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatHistory([])}
                    className="btn-ghost inline-flex min-h-[48px] items-center justify-center rounded-full px-5 text-sm font-semibold"
                  >
                    Clear History
                  </button>
                </div>
              </div>

              {chatReply ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Final Verdict</p>
                    <p className="mt-3 text-base font-semibold text-black">{chatReply.finalVerdict}</p>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {chatReply.reasoning.map((item) => (
                        <div key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel-white-soft rounded-[22px] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Suggested Actions</p>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {chatReply.suggestedActions.map((item) => (
                        <div key={item} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  {chatReply.alternativeDomains.length ? (
                    <div className="xl:col-span-2 panel-white-soft rounded-[22px] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Alternative Domains</p>
                        <p className="text-sm text-slate-600">Ideas only, not availability guarantees.</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {chatReply.alternativeDomains.map((domain) => (
                          <Link
                            key={domain}
                            href={`/analyze?domain=${encodeURIComponent(domain)}`}
                            className="data-mono rounded-full border border-black bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-[var(--lime)]"
                          >
                            {domain}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}
