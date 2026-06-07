import Link from "next/link";

const capabilityCards = [
  {
    title: "Valuation Engine",
    copy: "Blend ML output, comparable sales, RDAP context, and TLD anchors into a believable pricing range.",
    accent: "lime",
  },
  {
    title: "Market Intelligence",
    copy: "Move from a single appraisal number to extension-level performance, category movement, and anomaly detection.",
    accent: "purple",
  },
  {
    title: "Acquisition Workflow",
    copy: "Turn a score into a target buy price, budget stance, watchlist decision, and negotiation posture.",
    accent: "white",
  },
];

const miniPipeline = [
  ["Input", "primeagent.ai", "Normalized and categorized"],
  ["ML", "₹1.52L", "Baseline from historical pattern match"],
  ["Comps", "₹1.34L", "Weighted nearest observed sales"],
  ["Decision", "Watch", "Acquisition depends on price discipline"],
];

const marketSignals = [
  [".com liquidity", "High", "Broadest exit path for commercial buyers"],
  [".ai pricing", "Firm", "Premium demand in AI/startup categories"],
  ["Opportunity band", "₹15k-₹80k", "Where mispriced names are easiest to surface"],
];

const liveRows = [
  ["northforge.ai", "84", "₹2.03L", "Taken", "Watch"],
  ["gridmint.com", "78", "₹1.62L", "Taken", "Watch"],
  ["fluxpilot.io", "72", "₹96k", "Taken", "Buy"],
  ["techtics.in", "54", "₹8.2k", "Available", "Avoid"],
];

const benchmarkCards = [
  [".com", "₹2.91L", "Primary liquidity benchmark"],
  [".ai", "₹1.83L", "Premium startup and AI demand"],
  [".io", "₹1.33L", "Developer and product-led demand"],
  [".in", "₹2.24L", "Country-sensitive pricing, buyer-fit dependent"],
];

const bentoCards = [
  {
    label: "Acquisition Logic",
    title: "Judge why a domain is worth touching before you spend time on outreach.",
    copy: "The product keeps score, value, risk, registrar timing, and resale posture in the same working view.",
    span: "lg:col-span-2",
  },
  {
    label: "Comparison",
    title: "Battle-test names side by side.",
    copy: "Run direct comparison or 3-5 domain battle mode and see winners for liquidity, brand strength, and acquisition posture.",
    span: "",
  },
  {
    label: "Watchlist",
    title: "Treat domains like a live pipeline.",
    copy: "Recheck expiry windows, watch value drift, and keep a buy price and stance on every monitored name.",
    span: "",
  },
  {
    label: "Market Layer",
    title: "Bring reported sales into the same workflow.",
    copy: "TLD medians, category breakdowns, saved market screens, and anomaly flags keep the analysis grounded in observed history.",
    span: "lg:col-span-2",
  },
];

const workflowSteps = [
  ["01", "Source", "Use the assistant or market page to surface names and patterns worth screening."],
  ["02", "Analyze", "Check score layers, valuation evidence, and comparable sales before acting."],
  ["03", "Decide", "Set a target buy price, max budget, and recommendation stance."],
  ["04", "Monitor", "Move the domain into watchlist when timing matters more than immediate purchase."],
];

const systemPanels = [
  ["Comparable Sales", "Nearest past sales for the same TLD, similar length, and matching category shape."],
  ["Value Projection", "Scenario range over time to communicate upside and uncertainty without overpromising returns."],
  ["Investment Report", "Deterministic recommendation layer plus AI-assisted explanation for buy, watch, or avoid."],
  ["Market Screens", "Save reusable views like .ai startup names under a defined pricing band."],
];

const faqRows = [
  [
    "Why does this feel different from a registrar search?",
    "Because the product is built around evidence and workflow: comparable sales, watchlist posture, acquisition planning, and market context sit next to the appraisal.",
  ],
  [
    "What makes the value estimate believable?",
    "The value stack is blended from ML, nearest observed sales, TLD anchors, and risk-aware adjustments instead of just one raw formula.",
  ],
  [
    "Where does the product go next?",
    "More live aftermarket references, stronger comparable weighting, and deeper watchlist automation will make the research loop even tighter.",
  ],
];

export default function Home() {
  return (
    <main className="page-wrap pb-24">
      <section className="panel-grid relative overflow-hidden rounded-[36px] border border-black bg-[#0b0d12] px-6 py-8 text-white sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(204,255,63,0.08),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(120,136,238,0.16),transparent_24%)]" />
        <div className="relative grid min-h-[78vh] gap-8 xl:grid-cols-[minmax(0,1.05fr)_440px] xl:items-stretch">
          <div className="flex flex-col justify-between pt-2">
            <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-300">
              Premium domain intelligence workspace
            </div>
            <h1 className="mt-6 max-w-6xl text-6xl font-semibold leading-[0.9] tracking-[-0.07em] text-white sm:text-7xl lg:text-[6.8rem]">
              Research domain value like a market desk, not a registrar form.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              DomainFlip AI turns valuation, availability, comparable sales, resale posture, and acquisition workflow into one product-grade research surface.
            </p>

            <div className="mt-8 panel-dark rounded-[30px] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="data-mono flex min-h-14 flex-1 items-center rounded-2xl border border-white/10 bg-black/30 px-4 text-base text-slate-200">
                  search a domain, compare it, or stress-test an acquisition thesis
                </div>
                <Link
                  href="/analyze"
                  className="btn-lime inline-flex min-h-14 items-center justify-center rounded-2xl px-6 text-sm font-semibold"
                >
                  Analyze Domain
                </Link>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {capabilityCards.map((item) => (
                <div key={item.title} className="panel-dark-soft rounded-[24px] p-5">
                  <div
                    className={`h-1.5 w-14 rounded-full ${
                      item.accent === "lime"
                        ? "bg-[var(--lime)]"
                        : item.accent === "purple"
                          ? "bg-[var(--purple-bar)]"
                          : "bg-white"
                    }`}
                  />
                  <p className="mt-5 text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{item.copy}</p>
                </div>
              ))}
            </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="panel-dark rounded-[30px] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="section-eyebrow text-slate-400">Live Analysis Chain</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Value formation trace</h2>
                </div>
                <span className="rounded-full border border-[var(--lime)]/20 bg-[var(--lime)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lime)]">
                  Active
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {miniPipeline.map(([label, value, note], index) => (
                  <div key={label} className="rounded-[22px] border border-white/10 bg-[#101726] px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          {String(index + 1).padStart(2, "0")} · {label}
                        </p>
                        <p className="mt-2 data-mono text-xl font-semibold text-white">{value}</p>
                      </div>
                      <p className="max-w-[180px] text-right text-sm leading-6 text-slate-400">{note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {marketSignals.map(([label, value, note]) => (
                <div key={label} className="panel-dark-soft rounded-[24px] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="panel-white surface-ring rounded-[34px] p-6 sm:p-8">
          <div className="flex flex-col gap-3 border-b subtle-divider pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-eyebrow">Live Workspace</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black">
                Candidate pipeline with pricing, posture, and next action in one board
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-7 text-slate-600">
              See which names deserve capital, which ones deserve monitoring, and which ones should be dropped.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-[26px] border border-black bg-white">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b subtle-divider text-[11px] uppercase tracking-[0.18em] text-slate-600">
                  <th className="px-4 py-4 font-bold">Domain</th>
                  <th className="px-4 py-4 font-bold">Score</th>
                  <th className="px-4 py-4 font-bold">Value</th>
                  <th className="px-4 py-4 font-bold">Status</th>
                  <th className="px-4 py-4 font-bold">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {liveRows.map((row) => (
                  <tr key={row[0]} className="border-b border-black/8 text-sm last:border-b-0">
                    <td className="data-mono px-4 py-4 font-medium text-black">{row[0]}</td>
                    <td className="data-mono px-4 py-4 text-slate-700">{row[1]}</td>
                    <td className="data-mono px-4 py-4 text-slate-700">{row[2]}</td>
                    <td className="px-4 py-4 text-slate-700">{row[3]}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          row[4] === "Buy"
                            ? "border-black bg-[var(--lime)] text-black"
                            : row[4] === "Watch"
                              ? "border-black bg-[var(--purple-bar)] text-black"
                              : "border-black bg-white text-black"
                        }`}
                      >
                        {row[4]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-white rounded-[34px] p-6">
            <p className="section-eyebrow">What you get</p>
            <h3 className="mt-2 text-2xl font-semibold text-black">A clearer decision before you buy</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Score, valuation, market context, and ownership timing sit in one place so the next move is obvious.
            </p>
          </div>
          <div className="panel-white rounded-[34px] p-6">
            <p className="section-eyebrow">How it helps</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>Screen domains with value evidence, not just score decoration.</li>
              <li>Jump from market research to analysis without losing context.</li>
              <li>Move viable names into watchlist and acquisition planning.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10 panel-white surface-ring rounded-[34px] px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3 border-b subtle-divider pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow">Product Coverage</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black">
              Everything needed to move from idea to acquisition
            </h2>
          </div>
          <Link href="/assistant" className="btn-ghost inline-flex rounded-full px-5 py-3 text-sm font-semibold">
            Explore Assistant
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {bentoCards.map((card) => (
            <div key={card.title} className={`panel-white-soft rounded-[26px] p-6 ${card.span}`}>
              <p className="section-eyebrow">{card.label}</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-700">{card.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="panel-white surface-ring rounded-[34px] p-6 sm:p-8">
          <div className="border-b subtle-divider pb-5">
            <p className="section-eyebrow">Workflow</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black">
              From sourcing a name to deciding whether it deserves budget
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map(([index, title, copy]) => (
              <div key={index} className="panel-white-soft rounded-[24px] p-5">
                <p className="data-mono text-sm font-semibold text-slate-500">{index}</p>
                <h3 className="mt-3 text-xl font-semibold text-black">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-white rounded-[34px] p-6">
          <p className="section-eyebrow">Decision Model</p>
          <div className="mt-5 space-y-3">
            {[
              ["Score", "Brandability, TLD strength, and risk"],
              ["Value", "ML + comps + benchmark blend"],
              ["Context", "RDAP, resale posture, and market state"],
              ["Action", "Buy, watch, avoid, or monitor"],
            ].map(([label, note]) => (
              <div key={label} className="rounded-[22px] border border-black bg-white px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="intel-workspace" className="mt-10 panel-white surface-ring rounded-[34px] px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3 border-b subtle-divider pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow">Market Data Layer</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black">
              TLD benchmarks, pricing anchors, and market posture at a glance
            </h2>
          </div>
          <Link href="/market" className="btn-ghost inline-flex rounded-full px-5 py-3 text-sm font-semibold">
            Open Market Intelligence
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {benchmarkCards.map(([tld, value, note]) => (
            <div key={tld} className="panel-white-soft rounded-[24px] p-5">
              <p className="metric-kicker">Tracked extension</p>
              <p className="metric-value mt-4 text-black">{tld}</p>
              <p className="data-mono mt-3 text-lg font-semibold text-black">{value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_420px]">
        <div className="panel-white surface-ring rounded-[34px] p-6 sm:p-8">
          <div className="border-b subtle-divider pb-5">
            <p className="section-eyebrow">Core Modules</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black">
              The research layers behind the product
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {systemPanels.map(([title, copy]) => (
              <div key={title} className="panel-white-soft rounded-[24px] p-5">
                <p className="text-lg font-semibold text-black">{title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-white rounded-[34px] p-6">
          <p className="section-eyebrow">Why it matters</p>
          <h3 className="mt-2 text-2xl font-semibold text-black">One workspace, multiple decision lenses</h3>
          <div className="mt-5 space-y-3">
            {[
              "Domain value is not treated as a magical number.",
              "Every important price is paired with context and evidence.",
              "The watchlist behaves like an operating queue, not a bookmark drawer.",
              "The market page makes the product feel dataset-backed, not decorative.",
            ].map((point) => (
              <div key={point} className="rounded-[20px] border border-black bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 panel-white surface-ring rounded-[34px] px-6 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="section-eyebrow">Common Questions</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black">
              What the homepage should make clear in a few seconds
            </h2>
            <div className="mt-6 space-y-4">
              {faqRows.map(([question, answer]) => (
                <div key={question} className="rounded-[24px] border border-black bg-white px-5 py-5">
                  <p className="text-lg font-semibold text-black">{question}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-white-soft rounded-[30px] p-6">
            <p className="section-eyebrow">Get Started</p>
            <h3 className="mt-2 text-2xl font-semibold text-black">Jump straight into the product</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Start with a domain, move into market research, or use the assistant to source new ideas.
            </p>
            <div className="mt-6 grid gap-3">
              <Link href="/analyze" className="btn-lime inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold">
                Analyze a domain
              </Link>
              <Link href="/market" className="btn-ghost inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold">
                Explore the market page
              </Link>
              <Link href="/assistant" className="btn-ghost inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold">
                Open the assistant
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
