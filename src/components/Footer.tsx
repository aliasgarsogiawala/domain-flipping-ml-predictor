import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-black/[0.12] bg-[#090b0f] text-white">
      {/* Inner grid decoration */}
      <div
        className="pointer-events-none absolute inset-x-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(120,136,238,0.4), transparent)" }}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-12 sm:px-10 lg:px-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-slate-500">
            Domain intelligence suite
          </p>
          <p className="mt-3 text-[1.5rem] font-semibold tracking-[-0.045em] text-white">
            DomainFlip AI
          </p>
          <p className="mt-2 max-w-xs text-[0.8125rem] leading-[1.8] text-slate-400">
            Domain valuation, availability, resale signals, and investment intelligence in one workspace.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
          {[
            { href: "/",          label: "Home"      },
            { href: "/market",    label: "Market"    },
            { href: "/assistant", label: "Assistant" },
            { href: "/watchlist", label: "Watchlist" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/analyze"
            className="rounded-full border border-[var(--lime)]/20 bg-[var(--lime)]/10 px-4 py-2 font-medium text-[var(--lime)] transition hover:bg-[var(--lime)]/18 hover:text-white"
          >
            Analyze
          </Link>
        </nav>
      </div>

      <div className="border-t border-white/[0.05] px-5 py-4 sm:px-10 lg:px-12">
        <p className="text-center text-[0.75rem] text-slate-600">
          © {new Date().getFullYear()} DomainFlip AI. Built for disciplined domain investors.
        </p>
      </div>
    </footer>
  );
}
