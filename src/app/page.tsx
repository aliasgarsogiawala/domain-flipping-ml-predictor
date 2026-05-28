import Link from "next/link";

const featureCards = [
  {
    title: "Intelligence scoring",
    description:
      "Review naming quality, extension strength, registration history, and commercial relevance in one structured score.",
  },
  {
    title: "Availability workflow",
    description:
      "Check RDAP-backed ownership status, registrar data, and domain lifecycle details before you act.",
  },
  {
    title: "Portfolio tracking",
    description:
      "Monitor candidate domains, watch resale signals, and keep high-conviction names organized.",
  },
  {
    title: "Market context",
    description:
      "Pair domain quality with lightweight market heuristics so decisions feel grounded instead of speculative.",
  },
];

const portfolioRows = [
  ["northforge.ai", "High Potential", "Taken", "Cloudflare Registrar", "84"],
  ["marketgrid.com", "Premium Potential", "Taken", "GoDaddy", "89"],
  ["paymint.co", "Moderate Potential", "Available", "Not registered", "68"],
  ["agentstack.io", "High Potential", "Taken", "Namecheap", "79"],
];

export default function Home() {
  return (
    <main className="pb-16">
      <section className="dashboard-grid rounded-[28px] border border-[#e6e7eb] bg-[#f2ede6] px-6 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-start">
          <div className="pt-4">
            <div className="inline-flex rounded-full border border-[#e7d8cb] bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-600">
              Premium domain intelligence platform
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Analyze, monitor, and track valuable domains with registrar-grade clarity.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              DomainFlip AI combines domain screening, availability lookup, registration history,
              and portfolio-style monitoring into a clean workflow inspired by modern registrar dashboards.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/analyze"
                className="accent-button inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium"
              >
                Open analyzer
              </Link>
              <a
                href="#portfolio"
                className="secondary-button inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium"
              >
                View platform preview
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="surface rounded-2xl p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Coverage
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">RDAP</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Live ownership and registration timeline data.
                </p>
              </div>
              <div className="surface rounded-2xl p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Scoring model
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">10 signals</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Brand, length, market intent, and lifecycle quality.
                </p>
              </div>
              <div className="surface rounded-2xl p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Workspace
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">Portfolio-first</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Built for repeated screening and tracking, not one-off novelty checks.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-strong rounded-[28px] p-6">
            <div className="flex items-center justify-between border-b border-[#eceef2] pb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Dashboard preview</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Portfolio control center
                </h2>
              </div>
              <div className="rounded-full border border-[#f2d7c0] bg-[#fff2e8] px-3 py-1 text-sm font-medium text-[#b54708]">
                Live workflow
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="surface-muted rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Analyzed
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">primeagent.ai</p>
                <p className="mt-1 text-sm text-slate-600">High brand quality with strong TLD fit</p>
              </div>
              <div className="surface-muted rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Availability
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">Taken</p>
                <p className="mt-1 text-sm text-slate-600">Registrar and status data resolved</p>
              </div>
              <div className="surface-muted rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Portfolio score
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">84 / 100</p>
                <p className="mt-1 text-sm text-slate-600">Balanced domain quality and market signals</p>
              </div>
              <div className="surface-muted rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Registrar
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">Namecheap</p>
                <p className="mt-1 text-sm text-slate-600">Ownership metadata available</p>
              </div>
            </div>

            <div className="mt-6 surface-muted rounded-2xl p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Score distribution</span>
                <span className="text-slate-500">Rule 74 / Market 81</span>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Brandability</span>
                    <span>16 / 20</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#eceef2]">
                    <div className="h-2 w-4/5 rounded-full bg-[#F48120]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>TLD strength</span>
                    <span>14 / 20</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#eceef2]">
                    <div className="h-2 w-[70%] rounded-full bg-slate-700" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Commercial intent</span>
                    <span>11 / 15</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#eceef2]">
                    <div className="h-2 w-[73%] rounded-full bg-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-10">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Product capabilities
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              Built like a modern registrar intelligence layer
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => (
            <article key={feature.title} className="surface rounded-2xl p-6">
              <div className="mb-5 h-9 w-9 rounded-lg border border-[#f2d7c0] bg-[#fff2e8]" />
              <h3 className="text-lg font-semibold text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="portfolio" className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="surface-strong rounded-3xl p-6">
          <div className="flex flex-col gap-3 border-b border-[#eceef2] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Portfolio preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Candidate domain workspace
              </h2>
            </div>
            <div className="text-sm text-slate-500">Tracked names, availability, and score confidence</div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-[#eceef2] text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-2 py-3 font-medium">Domain</th>
                  <th className="px-2 py-3 font-medium">Verdict</th>
                  <th className="px-2 py-3 font-medium">Availability</th>
                  <th className="px-2 py-3 font-medium">Registrar</th>
                  <th className="px-2 py-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {portfolioRows.map((row) => (
                  <tr key={row[0]} className="border-b border-[#f1f2f5] text-sm last:border-b-0">
                    <td className="px-2 py-4 font-medium text-slate-900">{row[0]}</td>
                    <td className="px-2 py-4 text-slate-700">{row[1]}</td>
                    <td className="px-2 py-4 text-slate-700">{row[2]}</td>
                    <td className="px-2 py-4 text-slate-700">{row[3]}</td>
                    <td className="px-2 py-4 font-medium text-slate-900">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface rounded-3xl p-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Monitoring
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              Watch names before you buy
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Keep candidate domains in a portfolio-style queue, then revisit resale signals,
              expiry timelines, and ownership changes without restarting your analysis.
            </p>
          </div>
          <div className="surface rounded-3xl p-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Availability actions
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>Register available names directly from the analysis workflow.</li>
              <li>Watch taken names and monitor ownership metadata over time.</li>
              <li>Keep portfolio notes aligned with registrar and market signals.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="market-insights" className="mt-10">
        <div className="surface-strong rounded-3xl p-6">
          <div className="flex flex-col gap-3 border-b border-[#eceef2] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Market insights
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Extension trends and platform-ready patterns
              </h2>
            </div>
            <div className="text-sm text-slate-500">Common registrar-style benchmark view</div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {[
              [".com", "Primary resale benchmark"],
              [".ai", "Fast-growing startup demand"],
              [".io", "Developer and SaaS positioning"],
              [".co", "Lean brand alternative"],
            ].map(([tld, note]) => (
              <div key={tld} className="surface-muted rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tracked extension</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{tld}</p>
                <p className="mt-2 text-sm text-slate-600">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
