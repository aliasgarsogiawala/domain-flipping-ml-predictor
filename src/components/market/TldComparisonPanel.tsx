"use client";

import { useMemo, useState } from "react";
import type { TldPerformanceRow } from "@/lib/marketData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function computeStrength(row: TldPerformanceRow) {
  const countFactor = Math.min(40, row.saleCount * 1.4);
  const medianFactor = Math.min(40, row.medianSalePrice / 150);
  const averageFactor = Math.min(20, row.averageSalePrice / 400);
  return Math.round(countFactor + medianFactor + averageFactor);
}

function compareVerdict(primary: TldPerformanceRow, secondary: TldPerformanceRow) {
  const primaryStrength = computeStrength(primary);
  const secondaryStrength = computeStrength(secondary);

  if (primaryStrength === secondaryStrength) {
    return "Both extensions are tracking with similar market strength in the current dataset.";
  }

  const stronger = primaryStrength > secondaryStrength ? primary : secondary;
  const weaker = stronger.tld === primary.tld ? secondary : primary;

  if (stronger.saleCount > weaker.saleCount && stronger.medianSalePrice >= weaker.medianSalePrice) {
    return `${stronger.tld} is showing better liquidity and pricing support than ${weaker.tld} in the current dataset.`;
  }

  if (stronger.medianSalePrice > weaker.medianSalePrice) {
    return `${stronger.tld} is commanding a higher median price, while ${weaker.tld} may still have use for narrower buyer pools.`;
  }

  return `${stronger.tld} is moving through more observed sales, which makes it a steadier benchmark than ${weaker.tld}.`;
}

function MetricRow({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)] gap-3 rounded-2xl border border-black bg-white px-4 py-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="data-mono font-medium text-black">{primary}</span>
      <span className="data-mono font-medium text-black">{secondary}</span>
    </div>
  );
}

export default function TldComparisonPanel({ data }: { data: TldPerformanceRow[] }) {
  const fallbackPrimary = data[0]?.tld ?? ".com";
  const fallbackSecondary = data[1]?.tld ?? fallbackPrimary;
  const [primaryTld, setPrimaryTld] = useState(fallbackPrimary);
  const [secondaryTld, setSecondaryTld] = useState(fallbackSecondary);

  const primary = useMemo(
    () => data.find((row) => row.tld === primaryTld) ?? data[0],
    [data, primaryTld],
  );
  const secondary = useMemo(
    () => data.find((row) => row.tld === secondaryTld) ?? data[1] ?? data[0],
    [data, secondaryTld],
  );

  if (!primary || !secondary) return null;

  return (
    <div className="panel-white rounded-[30px] p-6">
      <div className="flex flex-col gap-3 border-b border-black pb-4">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">TLD Comparison</p>
        <h3 className="text-2xl font-semibold text-black">Benchmark two extensions side by side</h3>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <select
          value={primaryTld}
          onChange={(event) => setPrimaryTld(event.target.value)}
          className="min-h-[48px] rounded-2xl border border-black bg-white px-4 text-sm text-black outline-none"
        >
          {data.map((row) => (
            <option key={row.tld} value={row.tld}>
              {row.tld}
            </option>
          ))}
        </select>
        <select
          value={secondaryTld}
          onChange={(event) => setSecondaryTld(event.target.value)}
          className="min-h-[48px] rounded-2xl border border-black bg-white px-4 text-sm text-black outline-none"
        >
          {data.map((row) => (
            <option key={row.tld} value={row.tld}>
              {row.tld}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {[primary, secondary].map((row, index) => (
          <div
            key={`${row.tld}-${index}`}
            className={`rounded-[24px] border border-black p-5 ${index === 0 ? "bg-[var(--lime)]" : "bg-white"}`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Selected extension</p>
            <p className="mt-3 data-mono text-3xl font-semibold text-black">{row.tld}</p>
            <p className="mt-2 text-sm text-slate-700">
              Strength index {computeStrength(row)}/100 based on sale count, median price, and average sale price.
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <MetricRow
          label="Median"
          primary={formatCurrency(primary.medianSalePrice)}
          secondary={formatCurrency(secondary.medianSalePrice)}
        />
        <MetricRow
          label="Average"
          primary={formatCurrency(primary.averageSalePrice)}
          secondary={formatCurrency(secondary.averageSalePrice)}
        />
        <MetricRow
          label="Sale count"
          primary={primary.saleCount.toLocaleString()}
          secondary={secondary.saleCount.toLocaleString()}
        />
        <MetricRow
          label="Strength"
          primary={`${computeStrength(primary)}/100`}
          secondary={`${computeStrength(secondary)}/100`}
        />
      </div>

      <div className="mt-5 rounded-[22px] border border-black bg-[#101726] px-4 py-4 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Comparison verdict</p>
        <p className="mt-2 text-sm leading-7 text-slate-200">{compareVerdict(primary, secondary)}</p>
      </div>
    </div>
  );
}
