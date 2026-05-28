import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-card">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-12 md:flex-row md:items-start md:justify-between">
        {/* Company info */}
        <div className="flex-1">
          <p className="text-lg font-bold text-foreground">
            <span className="text-accent-lime">Domain</span>Tools
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            Domain intelligence, availability monitoring, and investment analysis.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          {/* Column 1 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">Products</p>
            <div className="mt-3 space-y-2">
              <Link href="/analyze" className="block text-sm text-foreground hover:text-button-purple transition-colors">
                Analyzer
              </Link>
              <Link href="/watchlist" className="block text-sm text-foreground hover:text-button-purple transition-colors">
                Watchlist
              </Link>
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">Market</p>
            <div className="mt-3 space-y-2">
              <a href="#market" className="block text-sm text-foreground hover:text-button-purple transition-colors">
                Insights
              </a>
              <a href="#benchmarks" className="block text-sm text-foreground hover:text-button-purple transition-colors">
                Benchmarks
              </a>
            </div>
          </div>

          {/* Column 3 */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">Resources</p>
            <div className="mt-3 space-y-2">
              <a href="#docs" className="block text-sm text-foreground hover:text-button-purple transition-colors">
                Docs
              </a>
              <a href="#api" className="block text-sm text-foreground hover:text-button-purple transition-colors">
                API
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom divider and copyright */}
      <div className="border-t-2 border-black bg-background px-6 py-4 sm:px-8 lg:px-12">
        <p className="text-center text-xs font-medium text-foreground">
          © 2025 DomainTools. Market data powered by registrar appraisals and RDAP.
        </p>
      </div>
    </footer>
  );
}
