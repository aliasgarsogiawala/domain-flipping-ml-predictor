"use client";

import { useMemo, useState } from "react";
import type { MarketSaleRecord } from "@/lib/marketData";

const STORAGE_KEY = "domainflip-market-screens-v1";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

const PRICE_FILTERS = [
  { label: "All prices", min: 0, max: Number.POSITIVE_INFINITY },
  { label: "$0-$1k", min: 0, max: 1000 },
  { label: "$1k-$5k", min: 1000, max: 5000 },
  { label: "$5k-$10k", min: 5000, max: 10000 },
  { label: "$10k-$50k", min: 10000, max: 50000 },
  { label: "$50k+", min: 50000, max: Number.POSITIVE_INFINITY },
];

const SORT_OPTIONS = [
  { label: "Latest reported", value: "latest" },
  { label: "Highest price", value: "highest" },
  { label: "Lowest price", value: "lowest" },
  { label: "Shortest name", value: "shortest" },
];

export default function SalesTable({
  records,
  tlds,
  categories,
}: {
  records: MarketSaleRecord[];
  tlds: string[];
  categories: string[];
}) {
  const [search, setSearch] = useState("");
  const [selectedTld, setSelectedTld] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceFilter, setSelectedPriceFilter] = useState("All prices");
  const [sortBy, setSortBy] = useState("latest");
  const [savedScreens, setSavedScreens] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const activePriceRange =
    PRICE_FILTERS.find((filter) => filter.label === selectedPriceFilter) ?? PRICE_FILTERS[0];

  const filtered = useMemo(() => {
    const filteredRecords = records.filter((record) => {
      const matchesSearch = !search.trim() || record.domain.includes(search.trim().toLowerCase());
      const matchesTld = selectedTld === "all" || record.tld === selectedTld;
      const matchesCategory = selectedCategory === "all" || record.category === selectedCategory;
      const matchesPrice =
        record.salePriceUsd >= activePriceRange.min && record.salePriceUsd < activePriceRange.max;

      return matchesSearch && matchesTld && matchesCategory && matchesPrice;
    });

    return filteredRecords.sort((left, right) => {
      if (sortBy === "highest") return right.salePriceUsd - left.salePriceUsd;
      if (sortBy === "lowest") return left.salePriceUsd - right.salePriceUsd;
      if (sortBy === "shortest") return (left.charLength ?? 99) - (right.charLength ?? 99);
      return (right.saleDateTimestamp ?? 0) - (left.saleDateTimestamp ?? 0);
    });
  }, [activePriceRange.max, activePriceRange.min, records, search, selectedCategory, selectedTld, sortBy]);

  const filteredMedian = useMemo(() => {
    if (filtered.length === 0) return 0;
    const prices = filtered.map((record) => record.salePriceUsd).sort((a, b) => a - b);
    const middle = Math.floor(prices.length / 2);
    return prices.length % 2 === 0
      ? Math.round((prices[middle - 1] + prices[middle]) / 2)
      : prices[middle];
  }, [filtered]);

  const highestFilteredSale = filtered[0]
    ? [...filtered].sort((left, right) => right.salePriceUsd - left.salePriceUsd)[0]
    : null;

  const activeFilters = [
    selectedTld !== "all" ? `TLD ${selectedTld}` : null,
    selectedCategory !== "all" ? `Category ${selectedCategory}` : null,
    selectedPriceFilter !== "All prices" ? selectedPriceFilter : null,
    search.trim() ? `Search ${search.trim()}` : null,
  ].filter(Boolean);

  const resetFilters = () => {
    setSearch("");
    setSelectedTld("all");
    setSelectedCategory("all");
    setSelectedPriceFilter("All prices");
    setSortBy("latest");
  };

  const currentScreen = JSON.stringify({
    search,
    selectedTld,
    selectedCategory,
    selectedPriceFilter,
    sortBy,
  });

  const saveCurrentScreen = () => {
    if (typeof window === "undefined") return;
    const next = [...new Set([currentScreen, ...savedScreens])].slice(0, 6);
    setSavedScreens(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const loadScreen = (rawScreen: string) => {
    try {
      const screen = JSON.parse(rawScreen) as {
        search: string;
        selectedTld: string;
        selectedCategory: string;
        selectedPriceFilter: string;
        sortBy: string;
      };
      setSearch(screen.search);
      setSelectedTld(screen.selectedTld);
      setSelectedCategory(screen.selectedCategory);
      setSelectedPriceFilter(screen.selectedPriceFilter);
      setSortBy(screen.sortBy);
    } catch {
      // Ignore malformed saved screens.
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_180px_180px_180px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search domain"
          className="data-mono min-h-[48px] rounded-2xl border border-black bg-white px-4 text-sm text-black outline-none"
        />
        <select
          value={selectedTld}
          onChange={(event) => setSelectedTld(event.target.value)}
          className="min-h-[48px] rounded-2xl border border-black bg-white px-4 text-sm text-black outline-none"
        >
          <option value="all">All TLDs</option>
          {tlds.map((tld) => (
            <option key={tld} value={tld}>
              {tld}
            </option>
          ))}
        </select>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="min-h-[48px] rounded-2xl border border-black bg-white px-4 text-sm text-black outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={selectedPriceFilter}
          onChange={(event) => setSelectedPriceFilter(event.target.value)}
          className="min-h-[48px] rounded-2xl border border-black bg-white px-4 text-sm text-black outline-none"
        >
          {PRICE_FILTERS.map((filter) => (
            <option key={filter.label} value={filter.label}>
              {filter.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="min-h-[48px] rounded-2xl border border-black bg-white px-4 text-sm text-black outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-[22px] border border-black bg-[var(--lime)] px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700">Filtered records</p>
          <p className="mt-2 data-mono text-2xl font-semibold text-black">{filtered.length.toLocaleString()}</p>
        </div>
        <div className="rounded-[22px] border border-black bg-white px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Filtered median price</p>
          <p className="mt-2 data-mono text-2xl font-semibold text-black">{formatCurrency(filteredMedian)}</p>
        </div>
        <div className="rounded-[22px] border border-black bg-white px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Highest visible sale</p>
          <p className="mt-2 data-mono text-lg font-semibold text-black">
            {highestFilteredSale ? highestFilteredSale.domain : "No records"}
          </p>
          <p className="mt-1 data-mono text-sm text-slate-700">
            {highestFilteredSale ? formatCurrency(highestFilteredSale.salePriceUsd) : "Adjust filters to widen the view"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.length > 0 ? (
          activeFilters.map((filter) => (
            <span
              key={filter}
              className="rounded-full border border-black bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-700"
            >
              {filter}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-black bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-700">
            No active filters
          </span>
        )}
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-full border border-black bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-black"
        >
          Reset filters
        </button>
        <button
          type="button"
          onClick={saveCurrentScreen}
          className="rounded-full border border-black bg-[var(--lime)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-black"
        >
          Save screen
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {savedScreens.length ? (
          savedScreens.map((screen, index) => {
            const parsed = JSON.parse(screen) as {
              selectedTld: string;
              selectedCategory: string;
              selectedPriceFilter: string;
            };

            return (
              <button
                key={`${screen}-${index}`}
                type="button"
                onClick={() => loadScreen(screen)}
                className="rounded-full border border-black bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-700"
              >
                {`${parsed.selectedTld === "all" ? "All TLDs" : parsed.selectedTld} · ${
                  parsed.selectedCategory === "all" ? "All categories" : parsed.selectedCategory
                } · ${parsed.selectedPriceFilter}`}
              </button>
            );
          })
        ) : (
          <span className="rounded-full border border-black bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-700">
            No saved market screens yet
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-black bg-white">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-black text-xs uppercase tracking-[0.18em] text-slate-600">
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Sale price</th>
              <th className="px-4 py-3 font-medium">TLD</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Venue</th>
              <th className="px-4 py-3 font-medium">Sale date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 150).map((record, index) => (
              <tr
                key={`${record.domain}-${record.salePriceUsd}-${record.saleDate ?? "unknown"}-${record.venue}-${record.sourceFile}-${index}`}
                className="border-b border-black/10 text-sm last:border-b-0"
              >
                <td className="data-mono px-4 py-4 font-medium text-black">{record.domain}</td>
                <td className="data-mono px-4 py-4 text-black">{formatCurrency(record.salePriceUsd)}</td>
                <td className="data-mono px-4 py-4 text-slate-700">{record.tld}</td>
                <td className="px-4 py-4 text-slate-700">{record.category}</td>
                <td className="px-4 py-4 text-slate-700">{record.venue}</td>
                <td className="data-mono px-4 py-4 text-slate-700">{formatDate(record.saleDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-slate-600">
        Showing {Math.min(filtered.length, 150).toLocaleString()} of {filtered.length.toLocaleString()} filtered rows from the latest observed sales window.
      </p>
    </div>
  );
}
