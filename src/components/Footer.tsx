import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/6 bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div className="text-sm text-slate-400">© {new Date().getFullYear()} DomainFlip AI</div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/" className="text-slate-300 hover:text-white">Home</Link>
          <a href="#features" className="text-slate-300 hover:text-white">Features</a>
          <a href="#market-insights" className="text-slate-300 hover:text-white">Market</a>
          <Link href="/analyze" className="text-cyan-300 hover:text-cyan-100">Analyze</Link>
        </div>
      </div>
    </footer>
  );
}
