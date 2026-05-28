"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all ${
        scrolled
          ? "border-[#e6e7eb] bg-[rgba(247,244,239,0.96)]"
          : "border-transparent bg-[rgba(247,244,239,0.92)]"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.22em] text-slate-900 uppercase"
          >
            <span className="text-[#F48120]">Domain</span>Flip AI
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Features
            </Link>
            <Link
              href="/#portfolio"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Portfolio
            </Link>
            <Link
              href="/#market-insights"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Market
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/watchlist"
            className="secondary-button inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
          >
            Watchlist
          </Link>
          <Link
            href="/analyze"
            className="accent-button inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium"
          >
            Analyze domain
          </Link>
        </div>
      </div>
    </header>
  );
}
