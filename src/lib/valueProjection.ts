import type { ResaleStatus } from "./domainMarketplace";
import type { RdapLookupResult } from "./rdap";

export type ValueProjectionPoint = {
  period: "Now" | "6M" | "1Y" | "2Y" | "3Y";
  low: number;
  expected: number;
  high: number;
  demandIndex: number;
  convictionIndex: number;
};

export type ValueProjectionResult = {
  confidence: "Low" | "Medium" | "High";
  trajectory: "Softening" | "Flat" | "Gradual Upside" | "Momentum Upside";
  expectedChangePercent: number;
  domainOutlookScore: number;
  trendDrivers: string[];
  riskDrivers: string[];
  points: ValueProjectionPoint[];
};

export type ValueProjectionInput = {
  estimatedValueUsd?: number | null;
  score: number;
  investmentScore: number;
  brandPrestigeScore: number;
  marketScore: number;
  riskLevel: "Low" | "Medium" | "High";
  tld: string;
  domainLength: number;
  availabilityStatus: RdapLookupResult["availabilityStatus"];
  resaleStatus?: ResaleStatus | "unknown" | null;
  comparableSalesCount?: number;
  averageComparableSimilarity?: number | null;
  premiumFeelScore?: number;
  endUserDemandScore?: number;
  aftermarketStrengthScore?: number;
  negotiationRiskScore?: number;
  categoryHint?: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundCurrency(value: number) {
  return Math.max(0, Math.round(value / 50) * 50);
}

export function generateValueProjection(
  input: ValueProjectionInput,
): ValueProjectionResult {
  const strongTld = ["com", "ai", "io", "app", "dev", "co"].includes(input.tld);
  const hasEstimatedValue = Boolean(input.estimatedValueUsd && input.estimatedValueUsd > 0);
  const comparableSalesCount = input.comparableSalesCount ?? 0;
  const averageComparableSimilarity = input.averageComparableSimilarity ?? 0;
  const premiumFeelScore = input.premiumFeelScore ?? 50;
  const endUserDemandScore = input.endUserDemandScore ?? 50;
  const aftermarketStrengthScore = input.aftermarketStrengthScore ?? 50;
  const negotiationRiskScore = input.negotiationRiskScore ?? 50;
  const baseFromScores = Math.max(
    750,
    Math.round(
      input.score * 85 +
        input.investmentScore * 55 +
        input.brandPrestigeScore * 35 +
        input.marketScore * 30,
    ),
  );

  const baseValue = hasEstimatedValue
    ? Math.max(input.estimatedValueUsd ?? 0, baseFromScores * 0.55)
    : baseFromScores;

  let growth = 0;
  const trendDrivers: string[] = [];
  const riskDrivers: string[] = [];

  if (input.score >= 80) growth += 0.045;
  else if (input.score >= 68) growth += 0.025;
  else if (input.score < 52) growth -= 0.015;

  if (strongTld) {
    growth += 0.01;
    trendDrivers.push(`${input.tld.toUpperCase()} still carries stronger buyer trust than fringe extensions.`);
  }
  if (input.brandPrestigeScore >= 75) {
    growth += 0.015;
    trendDrivers.push("Brand shape is strong enough to hold attention from startup or end-user buyers.");
  }
  if (input.marketScore >= 70) {
    growth += 0.01;
    trendDrivers.push("Observed market posture is supportive of continued pricing interest.");
  }
  if (input.domainLength <= 8) {
    growth += 0.01;
    trendDrivers.push("Shorter length improves memorability and resale portability.");
  } else if (input.domainLength >= 14) {
    growth -= 0.01;
    riskDrivers.push("Longer names usually take longer to clear at strong prices.");
  }

  if (premiumFeelScore >= 78) {
    growth += 0.012;
    trendDrivers.push("AI premium-feel review sees stronger than average brand quality.");
  } else if (premiumFeelScore <= 42) {
    growth -= 0.012;
    riskDrivers.push("Brand feel is weak, which usually compresses upside.");
  }

  if (endUserDemandScore >= 72) {
    growth += 0.012;
    trendDrivers.push("End-user demand score supports a healthier upside path.");
  } else if (endUserDemandScore <= 46) {
    growth -= 0.01;
    riskDrivers.push("End-user demand looks limited, which keeps projection growth modest.");
  }

  if (aftermarketStrengthScore >= 68 && comparableSalesCount >= 3) {
    growth += 0.012;
    trendDrivers.push("Comparable sale support strengthens the expected pricing corridor.");
  } else if (comparableSalesCount === 0) {
    growth -= 0.012;
    riskDrivers.push("No close comparable sales were found, so the forward range stays conservative.");
  }

  if (averageComparableSimilarity >= 62) {
    growth += 0.006;
  } else if (comparableSalesCount > 0 && averageComparableSimilarity < 45) {
    growth -= 0.006;
    riskDrivers.push("Historical matches are weaker than ideal, so the comp signal is noisy.");
  }

  if (input.categoryHint === "tech" || input.categoryHint === "brand") {
    growth += 0.006;
  } else if (input.categoryHint === "general") {
    growth -= 0.004;
  }

  if (input.riskLevel === "High") growth -= 0.03;
  else if (input.riskLevel === "Medium") growth -= 0.01;

  if (input.availabilityStatus === "Taken") growth -= 0.005;
  if (input.resaleStatus === "listed_for_sale") growth -= 0.005;
  if (input.resaleStatus === "needs_verification") growth -= 0.015;
  if (!hasEstimatedValue) growth -= 0.01;
  if (negotiationRiskScore >= 70) {
    growth -= 0.012;
    riskDrivers.push("Acquisition friction is elevated, which lowers the realizable path.");
  }

  growth = clamp(growth, -0.04, 0.08);

  const baseRange =
    input.riskLevel === "High"
      ? 0.34
      : input.riskLevel === "Medium"
        ? 0.24
        : 0.16;

  const range =
    input.availabilityStatus === "Unknown" || !hasEstimatedValue
      ? baseRange + 0.08
      : input.resaleStatus === "needs_verification"
        ? baseRange + 0.06
        : baseRange;

  const periods: Array<ValueProjectionPoint["period"]> = ["Now", "6M", "1Y", "2Y", "3Y"];
  const timeFactors = [0, 0.5, 1, 2, 3];

  const points = periods.map((period, index) => {
    const years = timeFactors[index];
    const expected = baseValue * Math.pow(1 + growth, years);
    const scenarioRange = range + years * 0.03;
    const demandIndex = clamp(
      Math.round(
        endUserDemandScore * 0.46 +
          aftermarketStrengthScore * 0.28 +
          input.marketScore * 0.16 +
          input.brandPrestigeScore * 0.1 +
          years * growth * 220,
      ),
      12,
      100,
    );
    const convictionIndex = clamp(
      Math.round(
        30 +
          input.score * 0.22 +
          averageComparableSimilarity * 0.24 +
          comparableSalesCount * 4 +
          (hasEstimatedValue ? 8 : 0) -
          (range - 0.16) * 70 -
          (negotiationRiskScore - 50) * 0.12,
      ),
      15,
      100,
    );

    return {
      period,
      expected: roundCurrency(expected),
      low: roundCurrency(expected * (1 - scenarioRange)),
      high: roundCurrency(expected * (1 + scenarioRange)),
      demandIndex,
      convictionIndex,
    };
  });

  const expectedChangePercent = Math.round(
    ((points.at(-1)?.expected ?? baseValue) / Math.max(1, points[0]?.expected ?? baseValue) - 1) * 100,
  );
  const domainOutlookScore = clamp(
    Math.round(
      input.score * 0.3 +
        input.investmentScore * 0.2 +
        input.brandPrestigeScore * 0.15 +
        input.marketScore * 0.15 +
        endUserDemandScore * 0.1 +
        aftermarketStrengthScore * 0.1 -
        (input.riskLevel === "High" ? 12 : input.riskLevel === "Medium" ? 5 : 0),
    ),
    0,
    100,
  );

  const trajectory: ValueProjectionResult["trajectory"] =
    expectedChangePercent >= 28
      ? "Momentum Upside"
      : expectedChangePercent >= 12
        ? "Gradual Upside"
        : expectedChangePercent <= -8
          ? "Softening"
          : "Flat";

  const confidence: ValueProjectionResult["confidence"] =
    hasEstimatedValue &&
    input.availabilityStatus !== "Unknown" &&
    input.score >= 68 &&
    input.riskLevel !== "High"
      ? "High"
      : hasEstimatedValue && input.availabilityStatus !== "Unknown"
        ? "Medium"
        : "Low";

  return {
    confidence,
    trajectory,
    expectedChangePercent,
    domainOutlookScore,
    trendDrivers: trendDrivers.slice(0, 4),
    riskDrivers: riskDrivers.slice(0, 4),
    points,
  };
}
