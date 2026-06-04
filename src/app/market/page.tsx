import CategoryBreakdownChart from "@/components/market/CategoryBreakdownChart";
import MarketSummaryCards from "@/components/market/MarketSummaryCards";
import SalesTable from "@/components/market/SalesTable";
import TldSalesChart from "@/components/market/TldSalesChart";
import { loadMarketData } from "@/lib/marketData";

export const revalidate = 3600;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function MarketPage() {
  const marketData = await loadMarketData();
  const maxDistribution = Math.max(...marketData.priceDistribution.map((row) => row.count), 1);
  const hasData = marketData.summary.totalSalesRecords > 0;

  return (
    <main className="pb-16">
      <section className="grid-paper rounded-[30px] border border-black px-6 py-8 sm:px-8 lg:px-10">
        <div className="max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-600">Market Intelligence</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-black sm:text-5xl">
            Domain Market Intelligence
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-700 sm:text-lg">
            Explore reported domain sales, extension performance, pricing benchmarks, and category-level market signals.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <MarketSummaryCards summary={marketData.summary} />
      </section>

      {!hasData ? (
        <section className="mt-8 panel-white rounded-[30px] p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Dataset Status</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-black">
              Market dataset is not available yet
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              DomainFlip could not find a processed sales file or a readable raw CSV source. Add domain sales CSVs in
              <span className="data-mono"> data/raw </span>
              or generate
              <span className="data-mono"> data/processed/domain_sales_master.csv </span>
              to unlock the full market dashboard.
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-8 panel-white rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-2 border-b border-black pb-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Latest Reported Sales</p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-black">Recently observed sales</h2>
          <p className="text-sm leading-7 text-slate-600">
            {marketData.dataSource === "processed"
              ? "Loaded from the processed master dataset for faster page performance."
              : "Loaded from raw CSV sources available in the repository."}
          </p>
        </div>
        <div className="mt-6">
          <SalesTable
            records={marketData.latestReportedSales}
            tlds={marketData.availableTlds}
            categories={marketData.availableCategories}
          />
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_400px]">
        <div className="panel-white rounded-[30px] p-6 sm:p-8">
          <div className="border-b border-black pb-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">TLD Performance</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-black">Dataset-backed extension trends</h2>
          </div>
          <div className="mt-6">
            <TldSalesChart data={marketData.tldPerformance} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel-white rounded-[30px] p-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Market Snapshot</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[20px] border border-black bg-[var(--lime)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700">Highest reported sale</p>
                <p className="mt-2 data-mono text-2xl font-semibold text-black">
                  {marketData.summary.highestReportedSale?.domain ?? "N/A"}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {marketData.summary.highestReportedSale
                    ? formatCurrency(marketData.summary.highestReportedSale.salePriceUsd)
                    : "No data"}
                </p>
              </div>
              <div className="rounded-[20px] border border-black bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Most active TLD</p>
                <p className="mt-2 data-mono text-2xl font-semibold text-black">{marketData.summary.mostActiveTld}</p>
              </div>
              <div className="rounded-[20px] border border-black bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Best median performer</p>
                <p className="mt-2 data-mono text-2xl font-semibold text-black">
                  {marketData.summary.bestPerformingTldByMedianPrice}
                </p>
              </div>
            </div>
          </div>

          <div className="panel-white rounded-[30px] p-6">
            <div className="border-b border-black pb-4">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Price Distribution</p>
              <h3 className="mt-2 text-2xl font-semibold text-black">Market pricing bands</h3>
            </div>
            <div className="mt-5 space-y-4">
              {marketData.priceDistribution.map((bucket) => (
                <div key={bucket.range}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="data-mono text-black">{bucket.range}</span>
                    <span className="data-mono text-slate-700">{bucket.count.toLocaleString()}</span>
                  </div>
                  <div className="h-3 rounded-full border border-black bg-white">
                    <div
                      className="h-full rounded-full bg-[#7888ee]"
                      style={{ width: `${Math.max(6, (bucket.count / maxDistribution) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 panel-white rounded-[30px] p-6 sm:p-8">
        <div className="border-b border-black pb-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">Category Trends</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-black">Category-level market signals</h2>
        </div>
        <div className="mt-6">
          <CategoryBreakdownChart data={marketData.categoryBreakdown} />
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {[
          ".com remains the strongest liquidity benchmark",
          ".ai shows strong premium demand in AI/startup categories",
          "ccTLD values vary heavily by country and buyer intent",
          "Median values are more reliable than averages because premium sales skew the mean",
        ].map((note, index) => (
          <article
            key={note}
            className={`rounded-[24px] border border-black p-5 ${
              index === 0 ? "bg-[var(--lime)]" : "panel-white"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Market Insight Notes</p>
            <p className="mt-3 text-base font-semibold leading-7 text-black">{note}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
