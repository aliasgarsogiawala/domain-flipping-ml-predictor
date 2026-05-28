import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-white/8 bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium uppercase tracking-[0.32em] text-slate-400">
            DomainFlip AI
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <a href="#features" className="hidden text-sm font-medium text-slate-300 hover:text-slate-100 sm:inline">
            Features
          </a>
          <a href="#market-insights" className="hidden text-sm font-medium text-slate-300 hover:text-slate-100 sm:inline">
            Market
          </a>
          <Link
            href="/analyze"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 shadow-sm hover:border-slate-500 hover:bg-slate-800"
          >
            Open Analyzer
          </Link>
        </div>
      </div>
    </nav>
  );
}
