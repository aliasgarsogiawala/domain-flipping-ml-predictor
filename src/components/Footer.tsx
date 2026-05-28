import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#e6e7eb] bg-[#f2ede6]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-8 sm:px-8 lg:px-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">
            DomainFlip AI
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Domain intelligence, availability monitoring, and portfolio-quality screening.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <Link href="/#features" className="hover:text-slate-900">
            Features
          </Link>
          <Link href="/#market-insights" className="hover:text-slate-900">
            Market
          </Link>
          <Link href="/analyze" className="text-[#F48120] hover:text-[#d96d14]">
            Analyze
          </Link>
        </div>
      </div>
    </footer>
  );
}
