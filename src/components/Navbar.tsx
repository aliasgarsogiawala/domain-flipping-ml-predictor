"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[var(--purple-bar)] px-4 py-2 text-center text-[13px] font-medium text-[#111111] shadow-[0_8px_20px_rgba(120,136,238,0.18)]">
        Domain intelligence, valuation signals, and watchlist monitoring in one workspace
      </div>
      <header
        className={`fixed inset-x-0 top-[36px] z-50 border-b border-black/10 bg-[rgba(247,247,245,0.92)] backdrop-blur-xl transition-all ${
          scrolled ? "shadow-[0_14px_34px_rgba(17,17,17,0.1)]" : ""
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black bg-white shadow-[0_10px_20px_rgba(17,17,17,0.08)]">
                <Image height={36} width={36} src={"/nav.png"} alt="DomainFlip AI mark" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Domain intelligence suite</p>
                <p className="text-[28px] font-bold tracking-[-0.05em] text-black">DomainFlip AI</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/70 p-1.5 shadow-[0_10px_24px_rgba(17,17,17,0.04)] md:flex">
              <Link href="/#features" className="rounded-full px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white">
                Products
              </Link>
              <Link href="/market" className="rounded-full px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white">
                Market
              </Link>
              <Link href="/assistant" className="rounded-full px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white">
                Assistant
              </Link>
              <Link href="/#intel-workspace" className="rounded-full px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white">
                Intelligence
              </Link>
              <Link href="/#market-insights" className="rounded-full px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white">
                Resources
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoaded && isSignedIn ? (
              <>
                <Link href="/watchlist" className="btn-ghost inline-flex rounded-full px-4 py-2 text-sm font-semibold">
                  Watchlist
                </Link>
                <Link href="/assistant" className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_10px_20px_rgba(17,17,17,0.04)] md:inline-flex">
                  AI Assistant
                </Link>
                <Link href="/analyze" className="btn-lime inline-flex rounded-full px-5 py-2 text-sm font-semibold">
                  Analyze Domain
                </Link>
                <UserButton />
              </>
            ) : isLoaded ? (
              <>
                <Link href="/assistant" className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_10px_20px_rgba(17,17,17,0.04)] md:inline-flex">
                  Assistant
                </Link>
                <Link href="/sign-in" className="btn-ghost inline-flex rounded-full px-4 py-2 text-sm font-semibold">
                  Sign In
                </Link>
                <Link href="/sign-up" className="btn-lime inline-flex rounded-full px-5 py-2 text-sm font-semibold">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link href="/analyze" className="btn-lime inline-flex rounded-full px-5 py-2 text-sm font-semibold">
                  Analyze Domain
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
