import type { MarketSummary } from "@/lib/marketData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MarketSummaryCards({ summary }: { summary: MarketSummary }) {
  const cards = [
    ["Total sales records", summary.totalSalesRecords.toLocaleString(), "Dataset-backed records loaded"],
    ["Median sale price", formatCurrency(summary.medianSalePrice), "Median is more reliable than average"],
    [
      "Highest reported sale",
      summary.highestReportedSale
        ? `${summary.highestReportedSale.domain} · ${formatCurrency(summary.highestReportedSale.salePriceUsd)}`
        : "N/A",
      "Top reported sale in the loaded dataset",
    ],
    ["Most active TLD", summary.mostActiveTld, "Highest record count across observed sales"],
    [
      "Best performing TLD",
      summary.bestPerformingTldByMedianPrice,
      "Highest median sale price among active TLDs",
    ],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map(([label, value, note], index) => (
        <div
          key={label}
          className={`rounded-[24px] border border-black p-5 ${
            index === 1 ? "bg-[var(--lime)]" : "panel-white"
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</p>
          <p className="mt-3 data-mono text-2xl font-semibold text-black">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{note}</p>
        </div>
      ))}
    </div>
  );
}
