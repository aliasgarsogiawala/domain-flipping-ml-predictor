export type MarketDemand = "Low" | "Medium" | "High";

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export type MockMarketData = {
  estimatedValueUsd: number;
  comparableSalesCount: number;
  averageComparableSaleUsd: number;
  highestComparableSaleUsd: number;
  marketDemand: MarketDemand;
  premiumSignal: boolean;
};

const PREMIUM_EXAMPLES = new Set([
  "google.com",
  "stripe.com",
  "openai.com",
  "uber.com",
  "figma.com",
  "linear.app",
]);

export function getMockMarketData(domain: string): MockMarketData {
  const normalized = domain.trim().toLowerCase();

  if (PREMIUM_EXAMPLES.has(normalized)) {
    return {
      estimatedValueUsd: 1_200_000,
      comparableSalesCount: 12,
      averageComparableSaleUsd: 120_000,
      highestComparableSaleUsd: 2_500_000,
      marketDemand: "High",
      premiumSignal: true,
    };
  }

  const h = hashString(normalized);
  const comparableSalesCount = h % 5; // 0-4
  const base = (h % 20000) + comparableSalesCount * 3000;
  const highest = base + (h % 100000);

  const estimatedValueUsd = Math.round(base * (1 + (h % 30) / 100));

  const demandBucket = h % 10;
  const marketDemand: MarketDemand = demandBucket <= 3 ? "Low" : demandBucket <= 7 ? "Medium" : "High";

  // Prevent random clean names from appearing premium — only premium examples true
  const premiumSignal = false;

  return {
    estimatedValueUsd,
    comparableSalesCount,
    averageComparableSaleUsd: comparableSalesCount > 0 ? Math.round(estimatedValueUsd / comparableSalesCount) : 0,
    highestComparableSaleUsd: comparableSalesCount > 0 ? highest : 0,
    marketDemand,
    premiumSignal,
  };
}
