"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-250 ${
        scrolled ? "backdrop-blur-sm bg-slate-900/60 border-b border-slate-700/40" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3 sm:px-8 lg:px-12">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium uppercase tracking-[0.28em] text-slate-100">
            <span className="text-cyan-400">Domain</span>Flip
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <a href="#features" className="hidden text-sm font-medium text-slate-200 hover:text-white sm:inline">
            Features
          </a>
          <a href="#market-insights" className="hidden text-sm font-medium text-slate-200 hover:text-white sm:inline">
            Market
          </a>
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center rounded-lg border border-cyan-600 bg-cyan-600/10 px-3 py-2 text-sm font-medium text-cyan-300 shadow-sm hover:bg-cyan-600/15"
          >
            Open Analyzer
          </Link>
        </div>
      </div>
    </nav>
  );
}
