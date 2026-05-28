"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <>
      {/* Announcement bar */}
      <div className="border-b-2 border-black bg-slate-100 px-6 py-2 text-center text-sm font-medium text-foreground sm:px-8 lg:px-12">
        Market data layer now active →
      </div>

      {/* Main navbar */}
      <nav className="border-b-2 border-black bg-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-foreground">
              <span className="text-accent-lime">Domain</span>Tools
            </Link>

            {/* Nav links - hidden on mobile */}
            <div className="hidden items-center gap-6 md:flex">
              <a href="#products" className="font-medium text-foreground hover:text-button-purple transition-colors">
                Products
              </a>
              <a href="#market" className="font-medium text-foreground hover:text-button-purple transition-colors">
                Market
              </a>
              <Link href="/watchlist" className="font-medium text-foreground hover:text-button-purple transition-colors">
                Watchlist
              </Link>
              <Link href="/analyze" className="font-medium text-foreground hover:text-button-purple transition-colors">
                Analyze
              </Link>
            </div>
          </div>

          {/* Right: CTA button */}
          <Link
            href="/analyze"
            className="btn-purple inline-flex rounded-lg px-5 py-3 text-sm font-medium"
          >
            Analyze Domain
          </Link>
        </div>
      </nav>
    </>
  );
}
