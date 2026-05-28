import Link from "next/link";

const features = [
  ["Valuation Engine", "Score domain quality, benchmark it against TLD market anchors, and keep the estimate realistic."],
  ["RDAP Lookup", "Pull registrar timing, lifecycle metadata, and ownership context into the same workflow."],
  ["Resale Detection", "Surface listing posture, acquisition friction, and visible resale signals before you chase a name."],
  ["Watchlist Monitoring", "Track taken domains over time and recheck value, status, and expiry windows."],
  ["Investment Report", "Turn technical and market signals into a deterministic buy, watch, or avoid recommendation."],
  ["Market Data Layer", "Use anchored TLD references so weak extensions do not inflate beyond believable ranges."],
];

const summaryRows = [
  ["marketgrid.com", "89", "$4,150", "Taken", "Buy"],
  ["northforge.ai", "84", "$2,450", "Taken", "Watch"],
  ["signalmint.io", "77", "$1,950", "Taken", "Watch"],
  ["gridmint.tech", "54", "$480", "Available", "Avoid"],
];

const benchmarkCards = [
  [".com", "$3,500 median visible sale"],
  [".ai", "$2,200 median visible sale"],
  [".io", "$1,600 median visible sale"],
  [".in", "$2,700 median visible sale"],
];

export default function Home() {
  return (
    <main className="pb-16">
      <section className="relative overflow-hidden rounded-[32px] border border-black bg-[#0b0d12] px-6 py-8 text-white sm:px-8 lg:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_430px]">
          <div className="pt-3">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-300">
              Premium domain intelligence platform
            </div>
            <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.96] tracking-[-0.05em] text-white sm:text-6xl">
              See what others miss in domain value, availability, and resale posture.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Domain valuation, availability, resale signals, and investment intelligence in one workspace.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-[#111318] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="data-mono flex min-h-14 flex-1 items-center rounded-2xl border border-white/10 bg-black/30 px-4 text-base text-slate-300">
                  search domain history, valuation, and acquisition risk
                </div>
                <Link
                  href="/analyze"
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-black bg-[var(--lime)] px-6 text-sm font-semibold text-black"
                >
                  Analyze Domain
                </Link>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Coverage", "RDAP + Signals", "Registrar data, projections, resale status, and anchored valuation."],
                ["Engine", "10+ factors", "Score weighting tuned for believable resale and acquisition scenarios."],
                ["Workspace", "Portfolio-first", "Built for repeated screening, comparison, and monitoring workflows."],
              ].map(([label, value, description]) => (
                <div key={label} className="rounded-[24px] border border-white/10 bg-[#101726] p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p>
                  <p className="data-mono mt-3 text-3xl font-semibold text-white">{value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#111318] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-400">Live intelligence snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Analysis console preview</h2>
              </div>
              <div className="rounded-full border border-[var(--lime)]/20 bg-[var(--lime)]/10 px-3 py-1 text-sm font-medium text-[var(--lime)]">
                Active
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Domain", "primeagent.ai", "High-signal AI asset with strong brand shape"],
                ["Adjusted Value", "$2,450", "Benchmark anchored and liquidity adjusted"],
                ["Recommendation", "Watch", "Strong potential with acquisition constraints"],
                ["Registrar", "Namecheap", "Ownership metadata resolved"],
              ].map(([label, value, description]) => (
                <div key={label} className="rounded-[20px] border border-white/10 bg-[#101726] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                  <p className={`mt-2 text-xl font-semibold ${label === "Recommendation" ? "text-[#f4b453]" : "text-white"} ${label !== "Registrar" && label !== "Recommendation" ? "data-mono" : ""}`}>
                    {value}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-10 rounded-[32px] border border-black bg-[#f7f7f5] px-6 py-8 shadow-[8px_8px_0_#111111] sm:px-8 lg:px-10">
        <div className="mb-7">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-600">Product Sections</p>
          <h2 className="mt-2 max-w-4xl text-3xl font-semibold tracking-[-0.03em] text-black">
            Built as a data-rich domain intelligence interface
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map(([title, description]) => (
            <article key={title} className="rounded-[24px] border border-black bg-[#f7f7f5] p-6 shadow-[8px_8px_0_#111111]">
              <div className="mb-5 h-9 w-9 rounded-full border border-black bg-[var(--lime)]" />
              <h3 className="text-lg font-semibold text-black">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="intel-workspace" className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="rounded-[32px] border border-black bg-[#f7f7f5] p-6 shadow-[8px_8px_0_#111111]">
          <div className="flex flex-col gap-3 border-b border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Intelligence Workspace</p>
              <h2 className="mt-2 text-2xl font-semibold text-black">Candidate portfolio monitor</h2>
            </div>
            <div className="text-sm text-slate-600">Valuation, availability, and recommendation visibility</div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-black text-xs uppercase tracking-[0.18em] text-slate-600">
                  <th className="px-2 py-3 font-medium">Domain</th>
                  <th className="px-2 py-3 font-medium">Score</th>
                  <th className="px-2 py-3 font-medium">Value</th>
                  <th className="px-2 py-3 font-medium">Status</th>
                  <th className="px-2 py-3 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row) => (
                  <tr key={row[0]} className="border-b border-black/10 text-sm last:border-b-0">
                    <td className="data-mono px-2 py-4 font-medium text-black">{row[0]}</td>
                    <td className="data-mono px-2 py-4 text-slate-700">{row[1]}</td>
                    <td className="data-mono px-2 py-4 text-slate-700">{row[2]}</td>
                    <td className="px-2 py-4 text-slate-700">{row[3]}</td>
                    <td className="px-2 py-4 text-slate-700">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-black bg-[#f7f7f5] p-6 shadow-[8px_8px_0_#111111]">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Trust Layer</p>
            <h3 className="mt-2 text-2xl font-semibold text-black">Technical data with acquisition context</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Inspect registrar history, anchored value estimates, resale posture, and recommendation logic without leaving the workspace.
            </p>
          </div>
          <div className="rounded-[32px] border border-black bg-[#f7f7f5] p-6 shadow-[8px_8px_0_#111111]">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Monitoring</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>Watch taken domains and recheck ownership posture over time.</li>
              <li>Normalize valuations against curated TLD sale references.</li>
              <li>Compare candidate names before committing capital or outreach.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="market-insights" className="mt-10 rounded-[32px] border border-black bg-[#f7f7f5] px-6 py-8 shadow-[8px_8px_0_#111111] sm:px-8 lg:px-10">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-600">Market Data Layer</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-black">
            TLD reference anchors and visible sale medians
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {benchmarkCards.map(([tld, note]) => (
            <div key={tld} className="rounded-[24px] border border-black bg-[#f7f7f5] p-5 shadow-[8px_8px_0_#111111]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600">Tracked extension</p>
              <p className="data-mono mt-3 text-3xl font-semibold text-black">{tld}</p>
              <p className="mt-2 text-sm text-slate-700">{note}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
