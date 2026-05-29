"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";

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
      <div className="fixed inset-x-0 top-0 z-50 bg-[var(--purple-bar)] px-4 py-2 text-center text-sm font-medium text-[#111111]">
        Domain intelligence, valuation signals, and watchlist monitoring in one workspace
      </div>
      <header
        className={`fixed inset-x-0 top-[36px] z-50 border-b border-black bg-[#f7f7f5] transition-shadow ${
          scrolled ? "shadow-[0_6px_20px_rgba(0,0,0,0.08)]" : ""
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-[34px] font-bold tracking-[-0.04em] text-black">
              DomainFlip AI
            </Link>
            <nav className="hidden items-center gap-7 md:flex">
              <Link href="/#features" className="text-sm font-medium text-black">
                Products
              </Link>
              <Link href="/#intel-workspace" className="text-sm font-medium text-black">
                Intelligence
              </Link>
              <Link href="/#market-insights" className="text-sm font-medium text-black">
                Resources
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <>
                <Link href="/watchlist" className="btn-ghost inline-flex rounded-full px-4 py-2 text-sm font-semibold">
                  Watchlist
                </Link>
                <Link href="/analyze" className="btn-lime inline-flex rounded-full px-5 py-2 text-sm font-semibold">
                  Analyze Domain
                </Link>
                  <UserButton />
              </>
            ) : isLoaded ? (
              <>
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
