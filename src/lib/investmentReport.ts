import type { ResaleStatus } from "./domainMarketplace";
import type { RdapLookupResult } from "./rdap";

export type InvestmentRecommendation = "Buy" | "Watch" | "Avoid";
export type ResalePotential = "Low" | "Medium" | "High";

export type InvestmentReport = {
  recommendation: InvestmentRecommendation;
  summary: string;
  reasonsToBuy: string[];
  reasonsToAvoid: string[];
  bestUseCases: string[];
  idealBuyerProfile: string;
  resalePotential: ResalePotential;
  acquisitionStrategy: string;
  riskExplanation: string;
  finalVerdict: string;
};

export type InvestmentReportInput = {
  domain: string;
  name: string;
  tld: string;
  score: number;
  investmentScore: number;
  brandPrestigeScore: number;
  availabilityStatus: RdapLookupResult["availabilityStatus"];
  resaleStatus?: ResaleStatus | "unknown" | null;
  estimatedValueUsd?: number | null;
  registrar?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  reasons: string[];
  weaknesses: string[];
  riskLevel: "Low" | "Medium" | "High";
  comparableSalesCount?: number;
};

function daysUntil(dateString: string | null | undefined) {
  if (!dateString) return null;
  const timestamp = Date.parse(dateString);
  if (Number.isNaN(timestamp)) return null;
  return Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
}

function yearsSince(dateString: string | null | undefined) {
  if (!dateString) return null;
  const timestamp = Date.parse(dateString);
  if (Number.isNaN(timestamp)) return null;
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24 * 365.25));
}

function deriveResalePotential(input: InvestmentReportInput): ResalePotential {
  const comparables = input.comparableSalesCount ?? 0;
  const value = input.estimatedValueUsd ?? 0;

  if (input.score >= 78 && comparables >= 2 && value >= 10000) {
    return "High";
  }

  if (input.score >= 58 || comparables > 0 || value >= 3000) {
    return "Medium";
  }

  return "Low";
}

function deriveRecommendation(input: InvestmentReportInput): InvestmentRecommendation {
  const expiryDays = daysUntil(input.expiresAt);
  const hasHeavyWeaknesses = input.weaknesses.length >= input.reasons.length + 1;
  const poorExtension = !["com", "ai", "io", "app", "dev", "co"].includes(input.tld);

  if (
    input.score < 50 ||
    (poorExtension && input.score < 60) ||
    hasHeavyWeaknesses ||
    ((input.estimatedValueUsd ?? 0) < 1500 && input.score < 58)
  ) {
    return "Avoid";
  }

  const acquisitionRisk =
    input.availabilityStatus === "Taken" ||
    input.resaleStatus === "listed_for_sale" ||
    input.resaleStatus === "possibly_listed" ||
    input.resaleStatus === "needs_verification" ||
    (expiryDays !== null && expiryDays > 0 && expiryDays <= 60);

  if (
    input.score >= 74 &&
    input.riskLevel !== "High" &&
    (input.estimatedValueUsd ?? 0) >= 3000 &&
    !acquisitionRisk &&
    input.availabilityStatus === "Available"
  ) {
    return "Buy";
  }

  return "Watch";
}

function buildBestUseCases(input: InvestmentReportInput) {
  const useCases: string[] = [];

  if (["ai", "io", "dev", "app"].includes(input.tld)) {
    useCases.push("Software product or startup brand");
  }

  if (input.reasons.some((reason) => reason.toLowerCase().includes("commercial"))) {
    useCases.push("Lead-generation or commercial landing page");
  }

  if (input.name.length <= 10) {
    useCases.push("Brandable company or product identity");
  }

  if (useCases.length === 0) {
    useCases.push("Niche informational or targeted brand project");
  }

  return useCases.slice(0, 3);
}

export function generateInvestmentReport(
  input: InvestmentReportInput,
): InvestmentReport {
  const recommendation = deriveRecommendation(input);
  const resalePotential = deriveResalePotential(input);
  const expiryDays = daysUntil(input.expiresAt);
  const ageYears = yearsSince(input.createdAt);
  const reasonsToBuy = input.reasons.slice(0, 4);
  const reasonsToAvoid = input.weaknesses.slice(0, 4);
  const confidenceLimited =
    !input.registrar || !input.createdAt || !input.expiresAt;

  if (reasonsToBuy.length === 0) {
    reasonsToBuy.push("The current analysis did not surface strong conviction signals.");
  }

  if (reasonsToAvoid.length === 0) {
    reasonsToAvoid.push("No major structural weaknesses were flagged by the current rules.");
  }

  const summaryParts = [
    `${input.domain} holds a ${input.score}/100 composite score with a ${input.riskLevel.toLowerCase()} risk profile.`,
  ];

  if (recommendation === "Buy") {
    summaryParts.push(
      "The current signal mix supports consideration as an immediately actionable acquisition."
    );
  } else if (recommendation === "Watch") {
    summaryParts.push(
      "The domain shows enough potential to monitor, but acquisition conditions or confidence are not clean enough for an immediate buy."
    );
  } else {
    summaryParts.push(
      "The present signal mix is not strong enough to justify active pursuit."
    );
  }

  if (input.resaleStatus === "listed_for_sale") {
    summaryParts.push(
      "Because it appears to be listed for sale, the investment case depends heavily on seller pricing discipline."
    );
  }

  if (confidenceLimited) {
    summaryParts.push("Some supporting ownership data is incomplete, so confidence is more limited.");
  }

  let acquisitionStrategy = "Keep the domain in view and reassess after more data is available.";

  if (recommendation === "Buy") {
    acquisitionStrategy =
      input.availabilityStatus === "Available"
        ? "If the registration cost is reasonable, this is the kind of name that can justify a direct registration rather than delayed monitoring."
        : "Treat this as a selective acquisition candidate and compare any asking price against the underlying score, usage fit, and comparable demand before moving.";
  } else if (recommendation === "Watch") {
    acquisitionStrategy =
      input.availabilityStatus === "Taken"
        ? "Add the domain to a watchlist, monitor registrar and expiry changes, and only engage if ownership signals or asking price become more favorable."
        : "Track this name over time and wait for clearer acquisition terms, stronger market confirmation, or a better entry point.";
  } else if (recommendation === "Avoid") {
    acquisitionStrategy =
      "Preserve capital for stronger names with cleaner extensions, fewer structural weaknesses, or clearer commercial upside.";
  }

  if (input.resaleStatus === "listed_for_sale") {
    acquisitionStrategy +=
      " If the seller is actively listing it, do not assume the asking price reflects intrinsic domain quality.";
  }

  if (expiryDays !== null && expiryDays > 0 && expiryDays <= 90) {
    acquisitionStrategy +=
      ` The registration appears to expire in about ${expiryDays} days, so it may be worth monitoring for ownership changes or a better negotiation window.`;
  }

  let idealBuyerProfile =
    "A buyer seeking a commercially usable digital asset with a realistic understanding of brand fit, acquisition cost, and holding risk.";

  if (["ai", "io", "dev", "app"].includes(input.tld)) {
    idealBuyerProfile =
      "A startup operator, SaaS builder, or product team looking for a concise tech-facing brand with modern extension tolerance.";
  } else if (input.tld === "com") {
    idealBuyerProfile =
      "A business buyer that values mainstream trust, broad recognizability, and stronger end-user branding flexibility.";
  }

  const riskNotes = [
    `The current risk level is ${input.riskLevel.toLowerCase()}, based on the balance between positive naming signals and structural weaknesses.`,
  ];

  if (input.availabilityStatus === "Taken") {
    riskNotes.push(
      "Because the domain is already registered, acquisition risk depends on the current owner, pricing expectations, and transfer feasibility."
    );
  }

  if (input.resaleStatus === "needs_verification") {
    riskNotes.push(
      "Marketplace detection is inconclusive, so ownership and resale conditions should be verified manually before making decisions."
    );
  }

  if (ageYears !== null && ageYears >= 5) {
    riskNotes.push(
      `The registration history appears to span roughly ${ageYears} years, which adds some credibility but does not guarantee liquidity or resale value.`
    );
  }

  if (confidenceLimited) {
    riskNotes.push(
      "Missing registrar or lifecycle fields reduce certainty around the ownership timeline."
    );
  }

  let finalVerdict = "";

  if (recommendation === "Buy") {
    finalVerdict =
      "This domain clears the bar for serious consideration, but it should still be evaluated against acquisition cost, real use-case fit, and your holding horizon.";
  } else if (recommendation === "Watch") {
    finalVerdict =
      "This domain is better treated as a monitored opportunity than an immediate purchase. The upside is plausible, but timing and acquisition terms matter.";
  } else {
    finalVerdict =
      "This domain does not currently show a strong enough balance of quality, liquidity, and acquisition clarity to justify pursuit.";
  }

  return {
    recommendation,
    summary: summaryParts.join(" "),
    reasonsToBuy,
    reasonsToAvoid,
    bestUseCases: buildBestUseCases(input),
    idealBuyerProfile,
    resalePotential,
    acquisitionStrategy,
    riskExplanation: riskNotes.join(" "),
    finalVerdict,
  };
}
