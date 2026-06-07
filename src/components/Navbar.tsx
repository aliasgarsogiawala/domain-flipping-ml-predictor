"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled]             = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoaded, isSignedIn }            = useUser();
  const pathname                            = usePathname();

  const navItems = useMemo(
    () => [
      { href: "/",          label: "Home",      match: "/"          },
      { href: "/analyze",   label: "Analyze",   match: "/analyze"   },
      { href: "/market",    label: "Market",    match: "/market"    },
      { href: "/assistant", label: "Assistant", match: "/assistant" },
      { href: "/watchlist", label: "Watchlist", match: "/watchlist" },
    ],
    [],
  );

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setMobileMenuOpen(false);

  return (
    <>
      <div className="!fixed inset-x-0 top-0 !z-[60] flex h-9 items-center justify-center border-b border-black/10 bg-[var(--purple-bar)] px-4">
        <p className="text-[12.5px] font-semibold tracking-[0.05em] text-[#111]">
          <span className="sm:hidden">Domain intelligence workspace</span>
          <span className="hidden sm:inline">
            Domain intelligence · valuation · watchlist monitoring · all in one workspace
          </span>
        </p>
      </div>

      <header
        className={`!fixed inset-x-0 top-9 !z-50 border-b border-black/[0.08] bg-[rgba(246,246,243,0.97)] backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-200 ${
          scrolled ? "shadow-[0_8px_28px_rgba(15,15,15,0.10)]" : ""
        }`}
      >
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-8 sm:py-4 lg:px-12">

          <Link href="/" onClick={close} className="flex min-w-0 shrink-0 items-center gap-2.5 justify-self-start sm:gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-black/90 bg-white sm:h-12 sm:w-12 sm:rounded-[18px]"
              style={{ boxShadow: "3px 3px 0 #0f0f0f, 0 8px 20px rgba(15,15,15,0.10)" }}
            >
              <Image
                height={32} width={32}
                src="/nav.png"
                alt="DomainFlip AI"
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
            </div>
            <div className="min-w-0">
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 sm:block">
                Domain intelligence suite
              </p>
              <p className="truncate text-[19px] font-bold tracking-[-0.055em] text-black sm:text-[24px]">
                DomainFlip AI
              </p>
            </div>
          </Link>

          <nav
            className="hidden items-center gap-1 justify-self-center rounded-full border border-black/10 bg-white/80 p-1 shadow-[0_3px_12px_rgba(15,15,15,0.06)] lg:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-5 py-2 text-[15px] font-semibold tracking-[-0.01em] transition-all ${
                  pathname === item.match
                    ? "bg-[#0f0f0f] text-white shadow-[0_2px_6px_rgba(15,15,15,0.28)]"
                    : "text-slate-700 hover:bg-black/6 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 justify-self-end lg:flex">
            {isLoaded && isSignedIn ? (
              <UserButton />
            ) : isLoaded ? (
              <>
                <Link
                  href="/sign-in"
                  className="btn-ghost inline-flex items-center rounded-full px-5 py-2 text-[15px]"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="btn-lime inline-flex items-center rounded-full px-5 py-2 text-[15px]"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <Link
                href="/analyze"
                className="btn-lime inline-flex items-center rounded-full px-5 py-2 text-[15px]"
              >
                Analyze domain
              </Link>
            )}
          </div>

          <div className="col-start-3 flex shrink-0 items-center gap-2 justify-self-end lg:hidden">
            {isLoaded && isSignedIn ? (
              <UserButton />
            ) : (
              <Link
                href="/sign-in"
                onClick={close}
                className="btn-ghost inline-flex items-center rounded-full px-3 py-1.5 text-sm"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-black bg-white"
              style={{ boxShadow: "2px 2px 0 #0f0f0f, 0 4px 12px rgba(15,15,15,0.06)" }}
            >
              <span className="relative block h-[14px] w-[18px]">
                <span className={`absolute left-0 top-0     h-[1.5px] w-[18px] bg-black transition-transform ${mobileMenuOpen ? "translate-y-[6px] rotate-45"   : ""}`} />
                <span className={`absolute left-0 top-[6px] h-[1.5px] w-[18px] bg-black transition-opacity ${mobileMenuOpen ? "opacity-0"                         : "opacity-100"}`} />
                <span className={`absolute left-0 top-[12px] h-[1.5px] w-[18px] bg-black transition-transform ${mobileMenuOpen ? "-translate-y-[6px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-black/8 bg-[rgba(246,246,243,0.98)] px-4 pb-5 pt-3 lg:hidden">
            <div className="mx-auto w-full max-w-7xl space-y-3">
              <nav className="grid gap-1.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={`rounded-2xl border px-4 py-3 text-[15px] font-semibold tracking-[-0.01em] transition ${
                      pathname === item.match
                        ? "border-black bg-black text-white"
                        : "border-black/12 bg-white text-black hover:border-black/24"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {isLoaded && !isSignedIn && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/sign-in"
                    onClick={close}
                    className="btn-ghost inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-[15px]"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={close}
                    className="btn-lime inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-[15px]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
