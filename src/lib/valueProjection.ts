import type { ResaleStatus } from "./domainMarketplace";
import type { RdapLookupResult } from "./rdap";

export type ValueProjectionPoint = {
  period: "Now" | "6M" | "1Y" | "2Y" | "3Y";
  low: number;
  expected: number;
  high: number;
};

export type ValueProjectionResult = {
  confidence: "Low" | "Medium" | "High";
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

  if (input.score >= 80) growth += 0.045;
  else if (input.score >= 68) growth += 0.025;
  else if (input.score < 52) growth -= 0.015;

  if (strongTld) growth += 0.01;
  if (input.brandPrestigeScore >= 75) growth += 0.015;
  if (input.marketScore >= 70) growth += 0.01;
  if (input.domainLength <= 8) growth += 0.01;
  else if (input.domainLength >= 14) growth -= 0.01;

  if (input.riskLevel === "High") growth -= 0.03;
  else if (input.riskLevel === "Medium") growth -= 0.01;

  if (input.availabilityStatus === "Taken") growth -= 0.005;
  if (input.resaleStatus === "listed_for_sale") growth -= 0.005;
  if (input.resaleStatus === "needs_verification") growth -= 0.015;
  if (!hasEstimatedValue) growth -= 0.01;

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

    return {
      period,
      expected: roundCurrency(expected),
      low: roundCurrency(expected * (1 - scenarioRange)),
      high: roundCurrency(expected * (1 + scenarioRange)),
    };
  });

  const confidence: ValueProjectionResult["confidence"] =
    hasEstimatedValue &&
    input.availabilityStatus !== "Unknown" &&
    input.score >= 68 &&
    input.riskLevel !== "High"
      ? "High"
      : hasEstimatedValue && input.availabilityStatus !== "Unknown"
        ? "Medium"
        : "Low";

  return { confidence, points };
}
