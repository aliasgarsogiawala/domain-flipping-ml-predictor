import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black bg-[#0f1116] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8 lg:px-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Domain intelligence suite</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">DomainFlip AI</p>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">
            Domain valuation, availability, resale signals, and investment intelligence in one workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300 hover:text-white">Home</Link>
          <Link href="/market" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300 hover:text-white">Market</Link>
          <Link href="/assistant" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300 hover:text-white">Assistant</Link>
          <Link href="/watchlist" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300 hover:text-white">Watchlist</Link>
          <Link href="/analyze" className="rounded-full border border-[var(--lime)]/20 bg-[var(--lime)]/10 px-4 py-2 text-[var(--lime)] hover:text-white">Analyze</Link>
        </div>
      </div>
    </footer>
  );
}
