"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  const navItems = useMemo(
    () => [
      { href: "/", label: "Home", match: "/" },
      { href: "/analyze", label: "Analyze", match: "/analyze" },
      { href: "/market", label: "Marketplace", match: "/market" },
      { href: "/assistant", label: "Assistant", match: "/assistant" },
      { href: "/watchlist", label: "Watchlist", match: "/watchlist" },
    ],
    [],
  );

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[var(--purple-bar)] px-4 py-2 text-center text-[12px] font-medium text-[#111111] shadow-[0_8px_20px_rgba(120,136,238,0.18)] sm:text-[13px]">
        <span className="sm:hidden">Domain intelligence in one workspace</span>
        <span className="hidden sm:inline">
          Domain intelligence, valuation signals, and watchlist monitoring in one workspace
        </span>
      </div>
      <header
        className={`fixed inset-x-0 top-[36px] z-50 border-b border-black/10 bg-[rgba(247,247,245,0.92)] backdrop-blur-xl transition-all ${
          scrolled ? "shadow-[0_14px_34px_rgba(17,17,17,0.1)]" : ""
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8 sm:py-4 lg:px-12">
          <div className="flex min-w-0 items-center gap-3 lg:gap-8">
            <Link href="/" onClick={closeMobileMenu} className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black bg-white shadow-[0_10px_20px_rgba(17,17,17,0.08)] sm:h-12 sm:w-12">
                <Image height={36} width={36} src={"/nav.png"} alt="DomainFlip AI mark" className="h-7 w-7 sm:h-9 sm:w-9" />
              </div>
              <div className="min-w-0">
                <p className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 sm:block">Domain intelligence suite</p>
                <p className="truncate text-[18px] font-bold tracking-[-0.05em] text-black sm:text-[28px]">DomainFlip AI</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/70 p-1.5 shadow-[0_10px_24px_rgba(17,17,17,0.04)] lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    pathname === item.match ? "bg-black text-white" : "text-black hover:bg-black hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
            {isLoaded && isSignedIn ? (
              <>
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

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            {isLoaded && isSignedIn ? (
              <>
                <UserButton />
              </>
            ) : (
              <Link href="/sign-in" onClick={closeMobileMenu} className="btn-ghost inline-flex rounded-full px-3 py-2 text-sm font-semibold">
                Sign In
              </Link>
            )}
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black bg-white text-black shadow-[0_8px_18px_rgba(17,17,17,0.06)]"
            >
              <span className="relative block h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-[2px] w-5 bg-black transition-transform ${
                    mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-[2px] w-5 bg-black transition-opacity ${
                    mobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 top-[14px] h-[2px] w-5 bg-black transition-transform ${
                    mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-black/10 bg-[rgba(247,247,245,0.98)] px-4 pb-4 pt-3 md:hidden">
            <div className="mx-auto w-full max-w-7xl space-y-4">
              <nav className="grid gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_8px_16px_rgba(17,17,17,0.04)] transition ${
                      pathname === item.match
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-black"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="grid gap-2">
                {isLoaded && !isSignedIn ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/sign-in"
                        onClick={closeMobileMenu}
                        className="btn-ghost inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={closeMobileMenu}
                        className="btn-lime inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
