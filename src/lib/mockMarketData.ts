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

const STRONG_TLDS = new Set(["com", "ai", "io", "co", "app", "dev", "in"]);
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
  const isStrongTld = STRONG_TLDS.has(tld);
  const trendMatches = tokens.filter((token) => TREND_TERMS.has(token)).length;
  const commercialMatches = tokens.filter((token) => COMMERCIAL_TERMS.has(token)).length;
  const vowels = (compactName.match(/[aeiou]/g) ?? []).length;
  const vowelRatio = compactName.length ? vowels / compactName.length : 0;
  const pronounceable = compactName.length > 0 && !/[bcdfghjklmnpqrstvwxyz]{4,}/.test(compactName);
  const distinctRatio = compactName.length ? new Set(compactName).size / compactName.length : 0;

  let quality = 18;

  if (isStrongTld) quality += 14;
  else quality -= 6;

  if (compactName.length <= 5) quality += 16;
  else if (compactName.length <= 8) quality += 10;
  else if (compactName.length <= 12) quality += 4;
  else quality -= 8;

  if (!containsNumber) quality += 6;
  else quality -= 10;

  if (!containsHyphen) quality += 5;
  else quality -= 9;

  if (pronounceable) quality += 8;
  else quality -= 9;

  if (vowelRatio >= 0.25 && vowelRatio <= 0.6) quality += 6;
  else quality -= 4;

  if (distinctRatio >= 0.7) quality += 4;
  if (trendMatches > 0) quality += Math.min(8, trendMatches * 3);
  if (commercialMatches > 0) quality += Math.min(7, commercialMatches * 3);
  if (tokens.length >= 3) quality -= 5;

  quality = clamp(quality, 4, 82);

  const demandScore = quality + trendMatches * 5 + commercialMatches * 4 + (hash % 8);
  const marketDemand: MarketDemand =
    demandScore >= 60 ? "High" : demandScore >= 38 ? "Medium" : "Low";

  const premiumSignal =
    isStrongTld &&
    compactName.length <= 8 &&
    !containsNumber &&
    !containsHyphen &&
    pronounceable &&
    distinctRatio >= 0.68 &&
    quality >= 62;

  const comparableSalesCount =
    quality >= 65 ? 3 + (hash % 4) : quality >= 45 ? 1 + (hash % 3) : hash % 2;

  const baseEstimate =
    quality <= 18
      ? 120 + (hash % 180)
      : quality <= 30
        ? 220 + (hash % 280)
        : quality <= 45
          ? 420 + (hash % 650)
          : quality <= 60
            ? 900 + (hash % 1400)
            : 1800 + (hash % 3200);

  const tldMultiplier =
    tld === "com" ? 1.25 : tld === "ai" ? 1.12 : tld === "io" ? 1.05 : tld === "in" ? 0.92 : isStrongTld ? 0.95 : 0.65;

  const marketDemandMultiplier =
    marketDemand === "High" ? 1.18 : marketDemand === "Medium" ? 1.0 : 0.82;

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
