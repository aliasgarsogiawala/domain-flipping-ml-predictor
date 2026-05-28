import type { RdapLookupResult } from "./rdap";

export type RuleAnalysis = {
  domain: string;
  name: string;
  tld: string;
  ruleScore: number;
  breakdown: DomainScoreBreakdown;
  reasons: string[];
  weaknesses: string[];
};

export type ApiAnalysisResponse = {
  domain: string;
  name: string;
  tld: string;
  score: number;
  ruleScore: number;
  marketScore: number;
  availabilityStatus: RdapLookupResult["availabilityStatus"];
  estimatedValueUsd: number;
  verdict:
    | "Low Potential"
    | "Moderate Potential"
    | "High Potential"
    | "Premium Potential";
  riskLevel: "Low" | "Medium" | "High";
  reasons: string[];
  weaknesses: string[];
  marketData: unknown;
  comparableSalesCount: number;
  rdap: RdapLookupResult;
  breakdown: DomainScoreBreakdown;
};

export type DomainScoreBreakdown = {
  tldStrength: number;
  length: number;
  brandability: number;
  memorability: number;
  pronounceability: number;
  premiumBrandSignal: number;
  trendRelevance: number;
  commercialIntent: number;
  registrationHistory: number;
  riskPenalties: number;
};

const STRONG_TLDS: Record<string, number> = {
  com: 18,
  ai: 14,
  io: 12,
  app: 10,
  dev: 9,
  co: 8,
};

const TRENDING_KEYWORDS = [
  "ai",
  "data",
  "cloud",
  "pay",
  "fin",
  "health",
  "crypto",
  "labs",
  "ops",
  "dev",
  "agent",
  "tech",
];

const COMMERCIAL_KEYWORDS = [
  "market",
  "capital",
  "invest",
  "media",
  "group",
  "hub",
  "works",
  "studio",
  "systems",
  "trade",
  "fund",
  "logic",
];

const BRANDABLE_SUFFIXES = [
  "ly",
  "io",
  "ify",
  "base",
  "stack",
  "flow",
  "lane",
  "forge",
  "labs",
  "grid",
  "nest",
];

const BRANDABLE_PREFIXES = ["get", "go", "try", "meta", "true", "clear"];

function normalizeInput(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .replace(/\s+/g, "");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isBrandable(name: string) {
  const vowels = (name.match(/[aeiou]/g) ?? []).length;
  const hasBalancedLength = name.length >= 4 && name.length <= 12;
  const hasVowelPresence = vowels >= 1 && vowels <= Math.ceil(name.length * 0.6);
  const looksPronounceable = !/[bcdfghjklmnpqrstvwxyz]{4,}/.test(name);
  const hasStrongEnding = BRANDABLE_SUFFIXES.some((suffix) => name.endsWith(suffix));

  return hasBalancedLength && hasVowelPresence && (looksPronounceable || hasStrongEnding);
}

function uniqueCharactersRatio(name: string) {
  return new Set(name).size / name.length;
}

function scoreTldStrength(tld: string, reasons: string[], weaknesses: string[]) {
  const score = STRONG_TLDS[tld] ?? 4;

  if (STRONG_TLDS[tld]) {
    reasons.push(`Strong .${tld} extension with recognizable resale demand.`);
  } else if (tld.length <= 3) {
    reasons.push(`.${tld} is serviceable, but not a top-tier aftermarket extension.`);
  } else {
    weaknesses.push(`.${tld} is a weaker extension for broad resale liquidity.`);
  }

  return clamp(score, 0, 20);
}

function scoreLength(name: string, reasons: string[], weaknesses: string[]) {
  const compactName = name.replace(/\./g, "");
  const length = compactName.length;

  if (length <= 4) {
    reasons.push("Ultra-short names are rare and highly memorable.");
    return 20;
  }

  if (length <= 6) {
    reasons.push("Short length supports memorability and buyer appeal.");
    return 17;
  }

  if (length <= 9) {
    reasons.push("The name is compact enough for strong everyday usability.");
    return 13;
  }

  if (length <= 12) {
    reasons.push("The length is acceptable, though less premium than shorter names.");
    return 9;
  }

  if (length <= 16) {
    weaknesses.push("Longer names are harder to brand and resell efficiently.");
    return 5;
  }

  weaknesses.push("Very long names typically weaken recall and resale value.");
  return 1;
}

function scoreBrandability(name: string, reasons: string[], weaknesses: string[]) {
  const compactName = name.replace(/\./g, "");
  let score = 0;

  if (isBrandable(compactName)) {
    score += 9;
    reasons.push("The name has strong pronounceability and brand-shape characteristics.");
  } else {
    weaknesses.push("The name is less naturally brandable under the current rules.");
  }

  const uniqueRatio = uniqueCharactersRatio(compactName);
  if (uniqueRatio >= 0.72) {
    score += 4;
    reasons.push("Character variety helps the name feel distinct.");
  } else if (uniqueRatio < 0.45) {
    weaknesses.push("Repetitive character patterns can reduce clarity.");
  }

  if (BRANDABLE_SUFFIXES.some((suffix) => compactName.endsWith(suffix))) {
    score += 3;
    reasons.push("The ending pattern fits common modern brand naming styles.");
  } else if (BRANDABLE_PREFIXES.some((prefix) => compactName.startsWith(prefix))) {
    score += 2;
    reasons.push("The prefix gives the domain a familiar startup naming structure.");
  }

  return clamp(score, 0, 20);
}

function scorePronounceability(name: string, reasons: string[], weaknesses: string[]) {
  const compactName = name.replace(/\./g, "");
  const consonantClusters = (compactName.match(/[bcdfghjklmnpqrstvwxyz]{3,}/g) ?? []).length;
  const vowelCount = (compactName.match(/[aeiou]/g) ?? []).length;
  let score = 0;

  if (vowelCount >= 1 && vowelCount <= Math.ceil(compactName.length * 0.6)) {
    score += 6;
    reasons.push("Balanced vowel presence supports pronunciation.");
  } else {
    weaknesses.push("Unusual vowel patterns may reduce pronounceability.");
  }

  if (consonantClusters === 0) {
    score += 4;
    reasons.push("No long consonant clusters keep the name easier to say.");
  } else {
    weaknesses.push("Long consonant clusters can make names harder to speak.");
  }

  if (!/[0-9-]/.test(compactName) && compactName.length <= 12) {
    score += 3;
  }

  return clamp(score, 0, 15);
}

function scoreMemorability(name: string, reasons: string[], weaknesses: string[]) {
  const compactName = name.replace(/\./g, "");
  let score = 0;

  if (compactName.length <= 6) {
    score += 8;
    reasons.push("Short names are easier to remember.");
  } else if (compactName.length <= 9) {
    score += 5;
  } else {
    weaknesses.push("Longer names tend to be less memorable.");
  }

  const uniq = uniqueCharactersRatio(compactName);
  if (uniq >= 0.7) {
    score += 5;
    reasons.push("Distinct character mix improves recall.");
  }

  if (/^[a-z]{3,}$/.test(compactName)) {
    score += 2;
  }

  return clamp(score, 0, 15);
}

function scorePremiumBrandSignal(
  name: string,
  tld: string,
  reasons: string[],
  weaknesses: string[],
) {
  const compactName = name.replace(/\./g, "");
  let score = 0;

  if (compactName.length <= 6) {
    score += 6;
    reasons.push("Short name contributes to premium brand feel.");
  }

  if (isBrandable(compactName)) {
    score += 6;
    reasons.push("Name follows common brandable patterns.");
  }

  if (uniqueCharactersRatio(compactName) >= 0.72) {
    score += 3;
  }

  if (/[aeiouy]$/.test(compactName)) {
    score += 2;
  }

  if (STRONG_TLDS[tld]) {
    score += 2;
  }

  if (compactName.includes("-") || /\d/.test(compactName)) {
    weaknesses.push("Hyphens or numbers reduce premium brand perception.");
    score -= 3;
  }

  return clamp(score, 0, 20);
}

function scoreKeywordTrend(name: string, reasons: string[], weaknesses: string[]) {
  const compactName = name.replace(/\./g, "");
  const trendHits = TRENDING_KEYWORDS.filter((keyword) => compactName.includes(keyword));

  if (trendHits.length === 0) {
    weaknesses.push("No meaningful trend keywords were detected.");
    return 4;
  }

  const score = Math.min(15, 6 + trendHits.length * 3);
  reasons.push(
    `Trend alignment detected through ${trendHits
      .map((keyword) => `"${keyword}"`)
      .join(", ")}.`,
  );

  return score;
}

function scoreCommercialIntent(name: string, reasons: string[], weaknesses: string[]) {
  const compactName = name.replace(/\./g, "");
  const commercialHits = COMMERCIAL_KEYWORDS.filter((keyword) =>
    compactName.includes(keyword),
  );

  if (commercialHits.length === 0) {
    weaknesses.push("Commercial buyer-intent signals are limited.");
    return 5;
  }

  const score = Math.min(15, 7 + commercialHits.length * 4);
  reasons.push("Commercial wording suggests clearer business use cases and buyer demand.");

  return score;
}

function scoreRiskPenalties(name: string, reasons: string[], weaknesses: string[]) {
  const compactName = name.replace(/\./g, "");
  let penalty = 0;

  if (name.includes(".")) {
    penalty += 4;
    weaknesses.push("Multiple segments make the domain feel less clean and direct.");
  }

  if (compactName.includes("-")) {
    penalty += 8;
    weaknesses.push("Hyphens often reduce trust and aftermarket appeal.");
  } else {
    reasons.push("No hyphens keeps the domain cleaner and more premium.");
  }

  if (/\d/.test(compactName)) {
    penalty += 7;
    weaknesses.push("Numbers can make the name harder to remember and market.");
  } else {
    reasons.push("No numbers improves readability and brand credibility.");
  }

  if (/[^a-z0-9.-]/.test(name)) {
    penalty += 3;
  }

  return clamp(penalty, 0, 20);
}

export function scoreRegistrationHistory(
  rdap: RdapLookupResult,
  reasons: string[],
  weaknesses: string[],
) {
  if (rdap.availabilityStatus !== "Taken" || !rdap.createdAt) {
    if (rdap.availabilityStatus === "Unknown") {
      weaknesses.push("Registration history could not be verified through RDAP.");
    }
    return 0;
  }

  const created = Date.parse(rdap.createdAt);
  if (Number.isNaN(created)) {
    return 0;
  }

  const ageYears = (Date.now() - created) / (1000 * 60 * 60 * 24 * 365.25);
  let score = 0;

  if (ageYears >= 15) {
    score = 10;
    reasons.push("Long registration history adds credibility to the asset.");
  } else if (ageYears >= 10) {
    score = 8;
    reasons.push("Older registration history can support perceived legitimacy.");
  } else if (ageYears >= 5) {
    score = 5;
    reasons.push("Several years of registration history provide a modest credibility signal.");
  } else if (ageYears >= 2) {
    score = 2;
  }

  if (rdap.statuses.some((status) => status.toLowerCase().includes("pending delete"))) {
    weaknesses.push("Pending delete status reduces confidence in current registration continuity.");
    score = Math.max(0, score - 4);
  }

  if (rdap.statuses.some((status) => status.toLowerCase().includes("redemption"))) {
    weaknesses.push("Redemption-related status suggests instability in registration history.");
    score = Math.max(0, score - 3);
  }

  return clamp(score, 0, 10);
}

export function analyzeRuleDomain(input: string): RuleAnalysis {
  const normalized = normalizeInput(input);
  const domainPattern = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,24}$/;

  if (!domainPattern.test(normalized)) {
    throw new Error("Enter a valid domain with a recognizable extension.");
  }

  const parts = normalized.split(".");
  const tld = parts.at(-1);
  const name = parts.slice(0, -1).join(".");

  if (!tld || !name || name.startsWith("-") || name.endsWith("-")) {
    throw new Error("Enter a valid domain with a valid name and TLD.");
  }

  const reasons: string[] = [];
  const weaknesses: string[] = [];
  const breakdown: DomainScoreBreakdown = {
    tldStrength: scoreTldStrength(tld, reasons, weaknesses),
    length: scoreLength(name, reasons, weaknesses),
    brandability: scoreBrandability(name, reasons, weaknesses),
    memorability: scoreMemorability(name, reasons, weaknesses),
    pronounceability: scorePronounceability(name, reasons, weaknesses),
    premiumBrandSignal: scorePremiumBrandSignal(name, tld, reasons, weaknesses),
    trendRelevance: scoreKeywordTrend(name, reasons, weaknesses),
    commercialIntent: scoreCommercialIntent(name, reasons, weaknesses),
    registrationHistory: 0,
    riskPenalties: scoreRiskPenalties(name, reasons, weaknesses),
  };

  const weightedTotal =
    breakdown.tldStrength * 1.0 +
    breakdown.length * 0.9 +
    breakdown.brandability * 1.1 +
    breakdown.memorability * 1.0 +
    breakdown.pronounceability * 0.9 +
    breakdown.premiumBrandSignal * 1.4 +
    breakdown.trendRelevance * 0.8 +
    breakdown.commercialIntent * 0.9 -
    breakdown.riskPenalties * 1.2;

  const ruleScore = clamp(Math.round(weightedTotal), 0, 100);

  return {
    domain: normalized,
    name,
    tld,
    ruleScore,
    breakdown,
    reasons,
    weaknesses,
  };
}

export function getVerdictFromScore(score: number): ApiAnalysisResponse["verdict"] {
  if (score >= 85) return "Premium Potential";
  if (score >= 70) return "High Potential";
  if (score >= 50) return "Moderate Potential";
  return "Low Potential";
}

export function getRiskFromScore(score: number): ApiAnalysisResponse["riskLevel"] {
  if (score >= 80) return "Low";
  if (score >= 55) return "Medium";
  return "High";
}

export const STRONG_TLDS_MAP = STRONG_TLDS;
