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
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-slate-400">
              DomainFlip AI
            </p>
          </div>
          <Link
            href="/analyze"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm hover:border-slate-500 hover:bg-slate-800"
          >
            Open Analyzer
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-16 py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:py-24">
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
          </div>

          <div className="rounded-2xl border border-white/10 bg-[color:var(--panel)] p-6 shadow-2xl shadow-black/20">
            <div className="rounded-xl border border-white/8 bg-[color:var(--panel-strong)] p-6">
              <div className="flex items-start justify-between border-b border-white/8 pb-5">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Example analysis
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-50">
                    primeagent.ai
                  </h2>
                </div>
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                  Score 86
                </div>
              </div>
              <dl className="mt-6 space-y-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Verdict</dt>
                  <dd className="font-medium text-slate-100">Premium Potential</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">TLD</dt>
                  <dd className="font-medium text-slate-100">.ai</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Length</dt>
                  <dd className="font-medium text-slate-100">10 characters</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Risk level</dt>
                  <dd className="font-medium text-amber-300">Medium</dd>
                </div>
              </dl>
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
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-[color:var(--panel)] p-6 shadow-lg shadow-black/10"
              >
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
      </div>
    </main>
  );
}
