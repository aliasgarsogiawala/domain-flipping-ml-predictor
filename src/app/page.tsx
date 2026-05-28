import Link from "next/link";

const lifecycleBlocks = [
  {
    title: "Valuation Engine",
    description: "Rule-based scoring + registrar appraisal integrated analysis with TLD weight adjustment.",
  },
  {
    title: "Availability Detection",
    description: "Live RDAP lookups reveal ownership, registrar data, and domain lifecycle timeline.",
  },
  {
    title: "Resale Analysis",
    description: "Detect marketplace signals, bot protection, and aftermarket liquidity confidence.",
  },
  {
    title: "Watchlist Monitoring",
    description: "Track portfolio candidates with persistent storage and bulk recheck capability.",
  },
];

const marketInsights = [
  { tld: ".com", label: "Market leader", stat: "Primary resale standard" },
  { tld: ".ai", label: "Startup demand", stat: "10x premium over TLD inflation" },
  { tld: ".io", label: "Developer standard", stat: "Strong SaaS positioning" },
  { tld: ".co", label: "Brand alternative", stat: "Lean global positioning" },
];

export default function Home() {
  return (
    <main className="pb-16 pt-4">
      {/* Hero Section */}
      <section className="relative mb-16 border-b-2 border-black pb-12">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
          <h1 className="text-5xl font-extrabold leading-tight text-foreground sm:text-6xl lg:text-7xl">
            Domain Intelligence for Every Stage of a Domain's Lifecycle
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground">
            Analyze valuation, resale signals, availability, expiry, and investment risk. Built
            for professional buyers, investors, and portfolio managers.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/analyze"
              className="btn-lime inline-flex items-center justify-center rounded-lg px-6 py-4 text-base font-semibold"
            >
              Analyze Domain
            </Link>
            <a
              href="#market-insights"
              className="btn-purple inline-flex items-center justify-center rounded-lg px-6 py-4 text-base font-semibold"
            >
              View Market Data
            </a>
          </div>
        </div>
      </section>

      {/* Stat Cards Section */}
      <section className="mb-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-2 border-black bg-accent-lime p-6 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground">Historical Sales</p>
              <p className="mt-4 text-4xl font-bold text-foreground">10k+</p>
              <p className="mt-2 text-sm text-foreground">Domains analyzed</p>
            </div>
            <div className="border-2 border-black bg-accent-lime p-6 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground">TLD Benchmarks</p>
              <p className="mt-4 text-4xl font-bold text-foreground">50+</p>
              <p className="mt-2 text-sm text-foreground">Extension benchmarks</p>
            </div>
            <div className="border-2 border-black bg-accent-lime p-6 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground">RDAP Lookups</p>
              <p className="mt-4 text-4xl font-bold text-foreground">Live</p>
              <p className="mt-2 text-sm text-foreground">Real-time registrar data</p>
            </div>
            <div className="border-2 border-black bg-accent-lime p-6 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-wide text-foreground">Watchlist Signals</p>
              <p className="mt-4 text-4xl font-bold text-foreground">Track</p>
              <p className="mt-2 text-sm text-foreground">Persistent monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle Workflow Section */}
      <section className="mb-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-foreground">The Domain Analysis Workflow</h2>
            <p className="mt-3 text-lg text-foreground">
              Professional-grade infrastructure for institutional-quality domain decisions
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {lifecycleBlocks.map((block, idx) => (
              <div key={idx} className="border-2 border-black bg-card p-6 rounded-lg">
                <div className="mb-4 inline-block bg-accent-lime px-3 py-1 text-xs font-bold uppercase tracking-wide rounded">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold text-foreground">{block.title}</h3>
                <p className="mt-3 text-sm leading-6 text-foreground">{block.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="mb-16 border-2 border-black rounded-lg bg-card p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-baseline justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-foreground">Live Analysis Example</p>
              <h2 className="mt-2 text-3xl font-bold text-foreground">
                <span className="font-mono-data">primeagent.ai</span>
              </h2>
            </div>
            <div className="flex gap-3">
              <span className="inline-block rounded-full border-2 border-black bg-accent-lime px-4 py-2 text-xs font-bold uppercase">
                Available
              </span>
              <span className="inline-block rounded-full border-2 border-black bg-background px-4 py-2 text-xs font-bold uppercase">
                High Quality
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: Details */}
            <div className="space-y-4">
              <div className="border-2 border-black bg-background p-4 rounded">
                <p className="text-xs font-bold uppercase tracking-wide text-foreground">Final Score</p>
                <p className="mt-2 text-3xl font-bold text-accent-lime">84 / 100</p>
                <p className="mt-1 text-sm text-foreground">Rule-based + market blend</p>
              </div>
              <div className="border-2 border-black bg-background p-4 rounded">
                <p className="text-xs font-bold uppercase tracking-wide text-foreground">Estimated Market Value</p>
                <p className="mt-2 text-2xl font-bold text-foreground">$12,500 - $18,000</p>
                <p className="mt-1 text-xs text-foreground">Based on registrar appraisal + TLD weighting</p>
              </div>
              <div className="border-2 border-black bg-background p-4 rounded">
                <p className="text-xs font-bold uppercase tracking-wide text-foreground">Registration Status</p>
                <p className="mt-2 text-sm font-mono-data text-foreground">Registered with Namecheap</p>
                <p className="mt-1 text-xs text-foreground">Owner data available via RDAP</p>
              </div>
            </div>

            {/* Right: Scoring Breakdown */}
            <div className="border-2 border-black bg-background p-6 rounded">
              <p className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground">Score Composition</p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Brandability</span>
                    <span className="text-accent-lime">18 / 20</span>
                  </div>
                  <div className="mt-2 h-3 rounded border-2 border-black bg-background">
                    <div className="h-3 w-9/10 rounded bg-accent-lime" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>TLD Strength</span>
                    <span className="text-accent-lime">16 / 20</span>
                  </div>
                  <div className="mt-2 h-3 rounded border-2 border-black bg-background">
                    <div className="h-3 w-4/5 rounded bg-accent-lime" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Commercial Intent</span>
                    <span className="text-accent-lime">14 / 20</span>
                  </div>
                  <div className="mt-2 h-3 rounded border-2 border-black bg-background">
                    <div className="h-3 w-7/10 rounded bg-accent-lime" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Insights Section */}
      <section id="market-insights" className="mb-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
          <div className="mb-10">
            <p className="text-sm font-bold uppercase tracking-wide text-foreground">Market insights</p>
            <h2 className="mt-3 text-4xl font-bold text-foreground">
              Extension trends and liquidity hubs
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {marketInsights.map((item, idx) => (
              <div key={idx} className="border-2 border-black bg-card p-6 rounded-lg">
                <p className="text-xs font-bold uppercase tracking-wide text-foreground">Tracked Extension</p>
                <p className="mt-4 text-4xl font-mono-data font-bold text-foreground">{item.tld}</p>
                <p className="mt-2 text-sm font-semibold text-accent-lime">{item.label}</p>
                <p className="mt-2 text-xs text-foreground">{item.stat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="border-2 border-black bg-accent-lime rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to analyze your domain?</h2>
          <p className="mt-3 text-lg text-foreground">
            Get instant valuation, availability check, and resale intelligence in seconds.
          </p>
          <Link
            href="/analyze"
            className="mt-6 inline-block rounded-lg border-2 border-foreground bg-foreground px-8 py-4 text-lg font-bold text-accent-lime hover:opacity-90 transition-opacity"
          >
            Start Analysis
          </Link>
        </div>
      </section>
    </main>
  );
}
