import Link from "next/link";

const features = [
  {
    title: "Domain scoring",
    description:
      "Evaluate candidate domains with a structured score built around resale-oriented signals.",
  },
  {
    title: "Brandability analysis",
    description:
      "Assess memorability, naming quality, and whether a domain feels commercially usable.",
  },
  {
    title: "TLD evaluation",
    description:
      "Compare extension strength across established and modern domain categories.",
  },
  {
    title: "Investment reasoning",
    description:
      "Review strengths and weaknesses behind each score before making a buying decision.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-12">
        

        <section className="grid flex-1 items-center gap-16 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
              Domain investment analytics
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
              Analyze domain names before you invest.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              DomainFlip AI gives early-stage investors a fast way to review
              brandability, TLD strength, keyword signals, name length, and
              commercial potential before buying a domain.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/analyze"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-white"
              >
                Start analyzing
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-transparent px-5 py-3 text-sm font-medium text-slate-300 hover:border-slate-600 hover:text-slate-100"
              >
                Review features
              </a>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="panel-subtle rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Scoring model
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-100">6 signals</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  TLD quality, brandability, length, trend relevance, intent, and risk.
                </p>
              </div>
              <div className="panel-subtle rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Output style
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-100">Transparent</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Every score is broken down so investment reasoning stays clear.
                </p>
              </div>
              <div className="panel-subtle rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Product state
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-100">MVP</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Rule-based today, ready for deeper data and ML upgrades later.
                </p>
              </div>
            </div>
          </div>

          <div className="panel rounded-3xl p-6 lg:p-7">
            <div className="panel-strong rounded-2xl p-6">
              <div className="flex items-start justify-between border-b border-white/8 pb-5">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Example analysis
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-50">
                    primeagent.ai
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Investor-style screening snapshot
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                    Brand Prestige 86
                  </div>
                  <div className="rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-1 text-sm font-medium text-sky-200">
                    Investment 78
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="panel-subtle rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Verdict</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">Premium Potential</p>
                </div>
                <div className="panel-subtle rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Availability</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-300">Available</p>
                </div>
                <div className="panel-subtle rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">TLD</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">.ai</p>
                </div>
                <div className="panel-subtle rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Risk level</p>
                  <p className="mt-2 text-lg font-semibold text-amber-300">Medium</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="panel-subtle rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Brandability</span>
                    <span className="font-medium text-slate-100">16 / 20</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/6">
                    <div className="h-2 w-4/5 rounded-full bg-slate-300/80" />
                  </div>
                </div>
                <div className="panel-subtle rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Commercial intent</span>
                    <span className="font-medium text-slate-100">11 / 15</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/6">
                    <div className="h-2 w-3/4 rounded-full bg-slate-300/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="pb-16 lg:pb-24">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                Core capabilities
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-50 sm:text-3xl">
                Built for practical domain screening
              </h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="panel rounded-2xl p-6"
              >
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                  0{index + 1}
                </p>
                <h3 className="text-lg font-semibold text-slate-50">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section id="market-insights" className="pt-8 pb-16 lg:pt-12 lg:pb-24">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
              Market Insights
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-50 sm:text-3xl">
              TLD trends & quick stats
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="panel-subtle rounded-2xl p-6 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Most valuable extension
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-50">.com</p>
              <p className="mt-2 text-sm text-slate-400">Premium resale & global businesses</p>
            </div>
            <div className="panel-subtle rounded-2xl p-6 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Fastest growing startup extension
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-50">.ai</p>
              <p className="mt-2 text-sm text-slate-400">AI startups, automation, and tools</p>
            </div>
            <div className="panel-subtle rounded-2xl p-6 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Popular SaaS extension
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-50">.io</p>
              <p className="mt-2 text-sm text-slate-400">Developer-first SaaS and platform brands</p>
            </div>
            <div className="panel-subtle rounded-2xl p-6 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Developer-focused extension
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-50">.dev</p>
              <p className="mt-2 text-sm text-slate-400">Technical products and tooling</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="panel rounded-2xl p-6">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">TLD comparison</p>
              <div className="mt-4 w-full overflow-x-auto">
                <table className="w-full table-fixed text-left">
                  <thead>
                    <tr className="text-sm text-slate-400">
                      <th className="w-1/4 pr-4 pb-2">TLD</th>
                      <th className="w-1/4 pr-4 pb-2">Strength</th>
                      <th className="pr-4 pb-2">Common usage</th>
                    </tr>
                  </thead>
                  <tbody className="mt-2 divide-y divide-white/6 text-sm">
                    <tr>
                      <td className="py-3 text-slate-100">.com</td>
                      <td className="py-3 text-slate-200">Very High</td>
                      <td className="py-3 text-slate-400">Used for businesses, startups, premium resale</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-100">.ai</td>
                      <td className="py-3 text-slate-200">High</td>
                      <td className="py-3 text-slate-400">Used for AI startups, automation, AI tools</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-100">.io</td>
                      <td className="py-3 text-slate-200">High</td>
                      <td className="py-3 text-slate-400">Used for SaaS, developer tools, tech products</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-100">.co</td>
                      <td className="py-3 text-slate-200">Medium-High</td>
                      <td className="py-3 text-slate-400">Used for startups and .com alternatives</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-100">.dev</td>
                      <td className="py-3 text-slate-200">Medium</td>
                      <td className="py-3 text-slate-400">Used for developer tools and technical products</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-100">.app</td>
                      <td className="py-3 text-slate-200">Medium</td>
                      <td className="py-3 text-slate-400">Used for apps and consumer products</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel rounded-2xl p-6">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">What makes a domain valuable?</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>Short length</li>
                <li>Clear spelling</li>
                <li>Strong TLD</li>
                <li>No hyphens</li>
                <li>No numbers</li>
                <li>Commercial intent</li>
                <li>Easy pronunciation</li>
              </ul>
              <p className="mt-4 text-xs text-slate-400">These are general market heuristics and not guaranteed investment outcomes.</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
