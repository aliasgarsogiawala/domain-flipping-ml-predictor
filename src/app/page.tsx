import Link from "next/link";

const capabilityCards = [
  {
    title: "Valuation engine",
    copy: "Combines a trained ML model, comparable sales, RDAP history, and TLD benchmarks into one defensible price range.",
    accent: "lime",
  },
  {
    title: "Market data",
    copy: "Works from reported sales, TLD medians, and category trends in a local dataset instead of a single unexplained number.",
    accent: "purple",
  },
  {
    title: "Acquisition workflow",
    copy: "Turns a score into a target price, a budget, a watchlist entry, and a clear buy, watch, or avoid call.",
    accent: "white",
  },
];

const miniPipeline = [
  ["Input",    "primeagent.ai", "Normalized and categorized"],
  ["ML",       "₹1.52L",        "Baseline from historical pattern match"],
  ["Comps",    "₹1.34L",        "Weighted nearest observed sales"],
  ["Decision", "Watch",         "Acquisition depends on price discipline"],
];

const marketSignals = [
  [".com liquidity",   "High",          "Broadest exit path for commercial buyers"],
  [".ai pricing",      "Firm",          "Premium demand in AI/startup categories"],
  ["Opportunity band", "₹15k-₹80k",    "Where mispriced names are easiest to surface"],
];

const liveRows = [
  ["northforge.ai",  "84", "₹2.03L", "Taken",     "Watch"],
  ["gridmint.com",   "78", "₹1.62L", "Taken",     "Watch"],
  ["fluxpilot.io",   "72", "₹96k",   "Taken",     "Buy"],
  ["techtics.in",    "54", "₹8.2k",  "Available", "Avoid"],
];

const benchmarkCards = [
  [".com", "₹2.91L", "Primary liquidity benchmark"],
  [".ai",  "₹1.83L", "Premium startup and AI demand"],
  [".io",  "₹1.33L", "Developer and product-led demand"],
  [".in",  "₹2.24L", "Country-sensitive pricing, buyer-fit dependent"],
];

const bentoCards = [
  {
    label: "Acquisition logic",
    title: "Decide whether a name is worth your time before you reach out.",
    copy:  "Score, value, risk, registrar timing, and resale status stay in one view, so the call is grounded in evidence.",
    span:  "lg:col-span-2",
  },
  {
    label: "Comparison",
    title: "Compare names side by side.",
    copy:  "Run a head-to-head or a 3 to 5 domain battle and see which name leads on liquidity, brand strength, and acquisition fit.",
    span:  "",
  },
  {
    label: "Watchlist",
    title: "Track domains like a pipeline.",
    copy:  "Monitor expiry windows and value drift, and keep a target price and stance on every name you follow.",
    span:  "",
  },
  {
    label: "Market layer",
    title: "Ground every estimate in reported sales.",
    copy:  "TLD medians, category breakdowns, saved screens, and outlier flags keep the analysis tied to observed history.",
    span:  "lg:col-span-2",
  },
];

const workflowSteps = [
  ["01", "Source",  "Use the assistant or market page to surface names worth screening."],
  ["02", "Analyze", "Review the score breakdown, valuation evidence, and comparable sales."],
  ["03", "Decide",  "Set a target price, a budget, and a buy, watch, or avoid call."],
  ["04", "Monitor", "Move the name to your watchlist when timing matters more than buying now."],
];

const systemPanels = [
  ["Comparable sales",  "Nearest reported sales by TLD, length, and category shape, each with a similarity score."],
  ["Value projection",  "A scenario range over time that shows upside and uncertainty without promising returns."],
  ["Investment report", "A rule-based buy, watch, or avoid call alongside an AI-written explanation."],
  ["Market screens",    "Save reusable views, such as .ai startup names within a set price band."],
];

const faqRows = [
  [
    "How is this different from a registrar search?",
    "A registrar tells you whether a name is free. This adds the parts that decide whether it is worth buying: comparable sales, a blended valuation, ownership history, and a watchlist to track it over time.",
  ],
  [
    "How is the value estimate produced?",
    "It blends a trained ML model, the nearest reported sales, and TLD benchmarks, then applies risk-aware caps. Each figure is shown with the evidence behind it.",
  ],
  [
    "Is the data real?",
    "Valuations use a local dataset of reported domain sales plus live RDAP lookups. The sample figures on this page are illustrative. Run a domain to see real output.",
  ],
];

export default function Home() {
  return (
    <main className="page-wrap pb-28">

      <section className="panel-grid relative overflow-hidden rounded-[40px] border border-black bg-[#090b0f] px-6 py-10 text-white sm:px-10 lg:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(120,136,238,0.14),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_10%,rgba(244,129,32,0.09),transparent)]" />
        </div>

        <div className="relative grid min-h-[80vh] gap-10 xl:grid-cols-[minmax(0,1.05fr)_460px] xl:items-stretch">

          <div className="flex flex-col justify-between gap-10 pt-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Open-source domain research
                </span>
              </div>

              <h1 className="max-w-5xl text-[3.0rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-[5rem] lg:text-[6.2rem]">
                Research domain value like a market desk, not a registrar form.
              </h1>

              <p className="max-w-2xl text-[1.0625rem] leading-[1.8] text-slate-300/90">
                DomainFlip AI brings valuation, availability, comparable sales, resale status, and acquisition planning into one place, so you can judge a name, not just look it up.
              </p>
            </div>

            <div className="panel-dark rounded-[32px] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="data-mono flex min-h-[54px] flex-1 items-center rounded-[20px] border border-white/10 bg-black/35 px-4 text-sm text-slate-400">
                  search a domain, compare it, or stress-test an acquisition thesis
                </div>
                <Link
                  href="/analyze"
                  className="btn-lime inline-flex min-h-[54px] items-center justify-center rounded-[20px] px-7 text-sm font-semibold"
                >
                  Analyze Domain
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {capabilityCards.map((item) => (
                <div key={item.title} className="panel-dark-soft rounded-[26px] p-5">
                  <div
                    className={`h-1 w-12 rounded-full ${
                      item.accent === "lime"
                        ? "bg-[var(--lime)]"
                        : item.accent === "purple"
                          ? "bg-[var(--purple-bar)]"
                          : "bg-white/40"
                    }`}
                  />
                  <p className="mt-5 text-[0.9375rem] font-semibold leading-snug text-white">{item.title}</p>
                  <p className="mt-2.5 text-[0.8125rem] leading-[1.7] text-slate-400">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="panel-dark rounded-[32px] p-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="section-eyebrow text-slate-500">Example Analysis Chain</p>
                  <h2 className="mt-2.5 text-[1.4rem] font-semibold leading-snug text-white">
                    Value formation trace
                  </h2>
                </div>
                <span className="shrink-0 rounded-full border border-[var(--lime)]/25 bg-[var(--lime)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lime)]">
                  Active
                </span>
              </div>

              <div className="mt-5 space-y-2.5">
                {miniPipeline.map(([label, value, note], index) => (
                  <div key={label} className="rounded-[20px] border border-white/[0.08] bg-[#0f1420] px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          {String(index + 1).padStart(2, "0")} · {label}
                        </p>
                        <p className="data-mono mt-2 text-[1.25rem] font-semibold text-white">{value}</p>
                      </div>
                      <p className="max-w-[160px] text-right text-[0.8125rem] leading-[1.6] text-slate-400">{note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {marketSignals.map(([label, value, note]) => (
                <div key={label} className="panel-dark-soft rounded-[24px] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-3 text-[1.4rem] font-semibold text-white">{value}</p>
                  <p className="mt-1.5 text-[0.8125rem] leading-[1.6] text-slate-400">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="panel-white surface-ring rounded-[34px] p-6 sm:p-8">
          <div className="flex flex-col gap-3 border-b pb-5 subtle-divider sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-eyebrow">Sample Workspace</p>
              <h2 className="mt-2.5 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.04em] text-black">
                Candidate pipeline with pricing, posture, and next action
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-[1.75] text-slate-500">
              See which names deserve capital, which ones deserve monitoring, and which ones should be dropped.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-black bg-white">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b subtle-divider bg-[#f2f0ec]">
                  {["Domain", "Score", "Value", "Status", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveRows.map((row) => (
                  <tr key={row[0]} className="border-b border-black/6 text-sm last:border-b-0 hover:bg-[#fafaf8]">
                    <td className="data-mono px-4 py-3.5 font-medium text-black">{row[0]}</td>
                    <td className="data-mono px-4 py-3.5 tabular-nums text-slate-600">{row[1]}</td>
                    <td className="data-mono px-4 py-3.5 tabular-nums text-slate-600">{row[2]}</td>
                    <td className="px-4 py-3.5 text-slate-600">{row[3]}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${
                          row[4] === "Buy"
                            ? "border-black bg-[var(--lime)] text-black"
                            : row[4] === "Watch"
                              ? "border-[var(--purple-bar)]/30 bg-[var(--purple-bar)]/15 text-[#4455cc]"
                              : "border-black/20 bg-white text-slate-600"
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

        <div className="space-y-5">
          <div className="panel-white rounded-[34px] p-6">
            <p className="section-eyebrow">What you get</p>
            <h3 className="mt-2.5 text-[1.375rem] font-semibold leading-snug text-black">
              A clearer decision before you buy
            </h3>
            <p className="mt-3.5 text-sm leading-[1.8] text-slate-600">
              Score, valuation, market context, and ownership timing sit in one place so the next move is obvious.
            </p>
          </div>
          <div className="panel-white rounded-[34px] p-6">
            <p className="section-eyebrow">How it helps</p>
            <ul className="mt-4 space-y-2.5 text-sm leading-[1.8] text-slate-600">
              <li className="flex items-start gap-2.5 before:mt-1.5 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-[var(--lime)]">
                Screen domains with value evidence, not just score decoration.
              </li>
              <li className="flex items-start gap-2.5 before:mt-1.5 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-[var(--lime)]">
                Jump from market research to analysis without losing context.
              </li>
              <li className="flex items-start gap-2.5 before:mt-1.5 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-[var(--lime)]">
                Move viable names into watchlist and acquisition planning.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-6 panel-white surface-ring rounded-[34px] px-6 py-8 sm:px-10 lg:px-12">
        <div className="flex flex-col gap-3 border-b pb-6 subtle-divider lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow">Product Coverage</p>
            <h2 className="mt-2.5 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.04em] text-black">
              Everything needed to move from idea to acquisition
            </h2>
          </div>
          <Link href="/assistant" className="btn-ghost inline-flex shrink-0 rounded-full px-5 py-2.5 text-sm">
            Explore Assistant
          </Link>
        </div>

        <div className="mt-6 grid gap-3.5 lg:grid-cols-3">
          {bentoCards.map((card) => (
            <div key={card.title} className={`panel-white-soft rounded-[24px] p-6 ${card.span}`}>
              <p className="section-eyebrow">{card.label}</p>
              <h3 className="mt-3 text-[1.25rem] font-semibold leading-snug tracking-[-0.025em] text-black">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-[1.8] text-slate-600">{card.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="panel-white surface-ring rounded-[34px] p-6 sm:p-8">
          <div className="border-b pb-5 subtle-divider">
            <p className="section-eyebrow">Workflow</p>
            <h2 className="mt-2.5 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.04em] text-black">
              From sourcing a name to deciding whether it deserves budget
            </h2>
          </div>
          <div className="mt-6 grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map(([index, title, copy]) => (
              <div key={index} className="panel-white-soft rounded-[22px] p-5">
                <p className="data-mono text-[0.8125rem] font-semibold text-slate-400">{index}</p>
                <h3 className="mt-3 text-[1.0625rem] font-semibold leading-snug text-black">{title}</h3>
                <p className="mt-2.5 text-[0.8125rem] leading-[1.7] text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-white rounded-[34px] p-6">
          <p className="section-eyebrow">Decision Model</p>
          <div className="mt-5 space-y-2.5">
            {[
              ["Score",   "Brandability, TLD strength, and risk"],
              ["Value",   "ML + comps + benchmark blend"],
              ["Context", "RDAP, resale posture, and market state"],
              ["Action",  "Buy, watch, avoid, or monitor"],
            ].map(([label, note]) => (
              <div key={label} className="rounded-[18px] border border-black/15 bg-white px-4 py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-1.5 text-sm leading-[1.6] text-slate-700">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="intel-workspace" className="mt-6 panel-white surface-ring rounded-[34px] px-6 py-8 sm:px-10 lg:px-12">
        <div className="flex flex-col gap-3 border-b pb-6 subtle-divider lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-eyebrow">Market Data Layer</p>
            <h2 className="mt-2.5 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.04em] text-black">
              TLD benchmarks, pricing anchors, and market posture at a glance
            </h2>
          </div>
          <Link href="/market" className="btn-ghost inline-flex shrink-0 rounded-full px-5 py-2.5 text-sm">
            Open Market Intelligence
          </Link>
        </div>

        <div className="mt-6 grid gap-3.5 lg:grid-cols-4">
          {benchmarkCards.map(([tld, value, note]) => (
            <div key={tld} className="panel-white-soft rounded-[22px] p-5">
              <p className="metric-kicker">Tracked extension</p>
              <p className="metric-value mt-4 text-black">{tld}</p>
              <p className="data-mono mt-3 text-lg font-semibold leading-none text-black">{value}</p>
              <p className="mt-2 text-[0.8125rem] leading-[1.65] text-slate-500">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_420px]">
        <div className="panel-white surface-ring rounded-[34px] p-6 sm:p-8">
          <div className="border-b pb-5 subtle-divider">
            <p className="section-eyebrow">Core Modules</p>
            <h2 className="mt-2.5 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.04em] text-black">
              The research layers behind the product
            </h2>
          </div>
          <div className="mt-6 grid gap-3.5 md:grid-cols-2">
            {systemPanels.map(([title, copy]) => (
              <div key={title} className="panel-white-soft rounded-[22px] p-5">
                <p className="text-[1rem] font-semibold text-black">{title}</p>
                <p className="mt-2.5 text-sm leading-[1.8] text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-white rounded-[34px] p-6">
          <p className="section-eyebrow">Why it matters</p>
          <h3 className="mt-2.5 text-[1.375rem] font-semibold leading-snug text-black">
            One workspace, multiple decision lenses
          </h3>
          <div className="mt-5 space-y-2.5">
            {[
              "Domain value is shown as a range with evidence, not a single mystery number.",
              "Every price is paired with the context and data behind it.",
              "The watchlist works like a pipeline, not a bookmark folder.",
              "The market page is backed by a real sales dataset, not placeholder charts.",
            ].map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-[18px] border border-black/12 bg-white px-4 py-3.5 text-sm leading-[1.7] text-slate-700"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--purple-bar)]" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 panel-white surface-ring rounded-[34px] px-6 py-8 sm:px-10 lg:px-12">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="section-eyebrow">Common Questions</p>
            <h2 className="mt-2.5 text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.04em] text-black">
              The questions people ask first
            </h2>
            <div className="mt-6 space-y-3.5">
              {faqRows.map(([question, answer]) => (
                <div key={question} className="rounded-[22px] border border-black/15 bg-white px-6 py-5">
                  <p className="text-[1rem] font-semibold leading-snug text-black">{question}</p>
                  <p className="mt-3 text-sm leading-[1.8] text-slate-600">{answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-white-soft rounded-[28px] p-6">
            <p className="section-eyebrow">Get Started</p>
            <h3 className="mt-2.5 text-[1.375rem] font-semibold leading-snug text-black">
              Jump straight into the product
            </h3>
            <p className="mt-3.5 text-sm leading-[1.8] text-slate-600">
              Start with a domain, move into market research, or use the assistant to source new ideas.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href="/analyze"
                className="btn-lime inline-flex min-h-[50px] items-center justify-center rounded-2xl px-5 text-sm"
              >
                Analyze a domain
              </Link>
              <Link
                href="/market"
                className="btn-ghost inline-flex min-h-[50px] items-center justify-center rounded-2xl px-5 text-sm"
              >
                Explore the market page
              </Link>
              <Link
                href="/assistant"
                className="btn-ghost inline-flex min-h-[50px] items-center justify-center rounded-2xl px-5 text-sm"
              >
                Open the assistant
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
