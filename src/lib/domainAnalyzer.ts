import {
  getMockAvailabilityStatus,
  type DomainAvailabilityStatus,
} from "@/lib/domainAvailability";

export type DomainAnalysisResult = {
  domain: string;
  name: string;
  tld: string;
  score: number;
  availabilityStatus: DomainAvailabilityStatus;
  breakdown: DomainScoreBreakdown;
  verdict:
    | "Low Potential"
    | "Moderate Potential"
    | "High Potential"
    | "Premium Potential";
  riskLevel: "Low" | "Medium" | "High";
  reasons: string[];
  weaknesses: string[];
};

export type DomainScoreBreakdown = {
  tldStrength: number;
  length: number;
  brandability: number;
  keywordTrend: number;
  commercialIntent: number;
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

function getVerdict(score: number): DomainAnalysisResult["verdict"] {
  if (score >= 85) return "Premium Potential";
  if (score >= 70) return "High Potential";
  if (score >= 50) return "Moderate Potential";
  return "Low Potential";
}

function getRiskLevel(score: number): DomainAnalysisResult["riskLevel"] {
  if (score >= 80) return "Low";
  if (score >= 55) return "Medium";
  return "High";
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
  reasons.push(
    "Commercial wording suggests clearer business use cases and buyer demand.",
  );

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

export function analyzeDomain(input: string): DomainAnalysisResult {
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
    keywordTrend: scoreKeywordTrend(name, reasons, weaknesses),
    commercialIntent: scoreCommercialIntent(name, reasons, weaknesses),
    riskPenalties: scoreRiskPenalties(name, reasons, weaknesses),
  };

  const weightedTotal =
    breakdown.tldStrength +
    breakdown.length +
    breakdown.brandability +
    breakdown.keywordTrend +
    breakdown.commercialIntent -
    breakdown.riskPenalties;

  const finalScore = clamp(weightedTotal, 0, 100);

  return {
    domain: normalized,
    name,
    tld,
    score: finalScore,
    availabilityStatus: getMockAvailabilityStatus(normalized),
    breakdown,
    verdict: getVerdict(finalScore),
    riskLevel: getRiskLevel(finalScore),
    reasons,
    weaknesses,
  };
}
