"use client";

import { useState } from "react";
import type { MarketSaleRecord } from "@/lib/marketData";

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

  const activePriceRange =
    PRICE_FILTERS.find((filter) => filter.label === selectedPriceFilter) ?? PRICE_FILTERS[0];

  const filtered = records.filter((record) => {
    const matchesSearch = !search.trim() || record.domain.includes(search.trim().toLowerCase());
    const matchesTld = selectedTld === "all" || record.tld === selectedTld;
    const matchesCategory = selectedCategory === "all" || record.category === selectedCategory;
    const matchesPrice =
      record.salePriceUsd >= activePriceRange.min && record.salePriceUsd < activePriceRange.max;

    return matchesSearch && matchesTld && matchesCategory && matchesPrice;
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
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
