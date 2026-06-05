export type MarketDemand = "Low" | "Medium" | "High";

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

const TOP_TIER_TLDS = new Set(["com", "ai", "io"]);
const MID_TIER_TLDS = new Set(["co", "app", "dev", "in"]);
const TREND_TERMS = new Set(["ai", "agent", "data", "cloud", "dev", "pay", "health", "tech"]);
const COMMERCIAL_TERMS = new Set(["capital", "market", "fund", "trade", "group", "studio", "systems"]);

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase();
}

function splitDomain(domain: string) {
  const normalized = normalizeDomain(domain);
  const parts = normalized.split(".");
  const tld = parts.at(-1) ?? "";
  const name = parts.slice(0, -1).join(".");
  return { name, tld };
}

function tokenizeName(name: string) {
  return name.split(/[^a-z0-9]+/).filter(Boolean);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getMockMarketData(domain: string): MockMarketData {
  const normalized = normalizeDomain(domain);

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

  const { name, tld } = splitDomain(normalized);
  const tokens = tokenizeName(name);
  const compactName = tokens.join("");
  const hash = hashText(normalized);
  const containsNumber = /\d/.test(name);
  const containsHyphen = name.includes("-");
  const isTopTierTld = TOP_TIER_TLDS.has(tld);
  const isMidTierTld = MID_TIER_TLDS.has(tld);
  const trendMatches = tokens.filter((token) => TREND_TERMS.has(token)).length;
  const commercialMatches = tokens.filter((token) => COMMERCIAL_TERMS.has(token)).length;
  const vowels = (compactName.match(/[aeiou]/g) ?? []).length;
  const vowelRatio = compactName.length ? vowels / compactName.length : 0;
  const pronounceable = compactName.length > 0 && !/[bcdfghjklmnpqrstvwxyz]{4,}/.test(compactName);
  const distinctRatio = compactName.length ? new Set(compactName).size / compactName.length : 0;

  let quality = 18;

  if (isTopTierTld) quality += 14;
  else if (isMidTierTld) quality += 8;
  else quality -= 6;

  if (compactName.length <= 5) quality += 16;
  else if (compactName.length <= 8) quality += 10;
  else if (compactName.length <= 12) quality += 4;
  else quality -= 8;

  if (!containsNumber) quality += 6;
  else quality -= 10;

  if (!containsHyphen) quality += 5;
  else quality -= 9;

  if (pronounceable) quality += 5;
  else quality -= 10;

  if (vowelRatio >= 0.25 && vowelRatio <= 0.6) quality += 6;
  else quality -= 4;

  if (distinctRatio >= 0.68 && distinctRatio <= 0.88) quality += 4;
  else if (distinctRatio > 0.92) quality -= 3;
  if (trendMatches > 0) quality += Math.min(8, trendMatches * 3);
  if (commercialMatches > 0) quality += Math.min(7, commercialMatches * 3);
  if (tokens.length >= 3) quality -= 5;
  if (tokens.length === 1 && compactName.length >= 8) quality -= 5;

  quality = clamp(quality, 4, 82);

  const demandScore = quality + trendMatches * 5 + commercialMatches * 4 + (hash % 8);
  const marketDemand: MarketDemand =
    demandScore >= 60 ? "High" : demandScore >= 38 ? "Medium" : "Low";

  const premiumSignal =
    isTopTierTld &&
    compactName.length <= 6 &&
    tokens.length === 1 &&
    !containsNumber &&
    !containsHyphen &&
    pronounceable &&
    distinctRatio >= 0.58 &&
    distinctRatio <= 0.86 &&
    vowelRatio >= 0.24 &&
    vowelRatio <= 0.58 &&
    quality >= 72;

  const comparableSalesCount =
    premiumSignal && quality >= 74
      ? 2 + (hash % 3)
      : quality >= 60
        ? 1 + (hash % 2)
        : 0;

  const baseEstimate =
    quality <= 18
      ? 18 + (hash % 22)
      : quality <= 30
        ? 28 + (hash % 32)
        : quality <= 45
          ? 45 + (hash % 55)
          : quality <= 60
            ? 70 + (hash % 80)
            : quality <= 72
              ? 120 + (hash % 140)
              : 220 + (hash % 260);

  const tldMultiplier =
    tld === "com"
      ? 1.12
      : tld === "ai"
        ? 1.04
        : tld === "io"
          ? 0.96
          : tld === "in"
            ? 0.42
            : isMidTierTld
              ? 0.62
              : 0.38;

  const marketDemandMultiplier =
    marketDemand === "High" ? 1.06 : marketDemand === "Medium" ? 1.0 : 0.88;

  const estimatedValueUsd = Math.round(baseEstimate * tldMultiplier * marketDemandMultiplier);
  const averageComparableSaleUsd =
    comparableSalesCount > 0 ? Math.round(estimatedValueUsd * (1.05 + comparableSalesCount * 0.08)) : 0;
  const highestComparableSaleUsd =
    comparableSalesCount > 0 ? Math.round(averageComparableSaleUsd * (1.35 + (hash % 20) / 100)) : 0;

  return {
    estimatedValueUsd,
    comparableSalesCount,
    averageComparableSaleUsd,
    highestComparableSaleUsd,
    marketDemand,
    premiumSignal,
  };
}
