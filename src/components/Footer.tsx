import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 sm:px-8 lg:px-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-lg font-semibold">DomainFlip AI</p>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">
            Domain valuation, availability, resale signals, and investment intelligence in one workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/#features" className="hover:text-white">Products</Link>
          <Link href="/#market-insights" className="hover:text-white">Resources</Link>
          <Link href="/analyze" className="text-[var(--lime)] hover:text-white">Analyze</Link>
        </div>
      </div>
    </footer>
  );
}
