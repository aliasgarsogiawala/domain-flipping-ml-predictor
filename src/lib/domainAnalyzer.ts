export type DomainAnalysisResult = {
  domain: string;
  name: string;
  tld: string;
  score: number;
  verdict:
    | "Low Potential"
    | "Moderate Potential"
    | "High Potential"
    | "Premium Potential";
  riskLevel: "Low" | "Medium" | "High";
  reasons: string[];
  weaknesses: string[];
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

export function analyzeDomain(input: string): DomainAnalysisResult {
  const normalized = normalizeInput(input);
  const domainPattern =
    /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,24}$/;

  if (!domainPattern.test(normalized)) {
    throw new Error("Enter a valid domain with a recognizable extension.");
  }

  const parts = normalized.split(".");
  const tld = parts.at(-1);
  const name = parts.slice(0, -1).join(".");

  if (!tld || !name || name.startsWith("-") || name.endsWith("-")) {
    throw new Error("Enter a valid domain with a valid name and TLD.");
  }

  let score = 40;
  const reasons: string[] = [];
  const weaknesses: string[] = [];

  const tldBoost = STRONG_TLDS[tld] ?? 2;
  score += tldBoost;
  if (STRONG_TLDS[tld]) {
    reasons.push(`Strong .${tld} extension with recognizable resale demand.`);
  } else {
    weaknesses.push(`.${tld} is less proven than top resale-focused extensions.`);
  }

  if (name.length <= 5) {
    score += 18;
    reasons.push("Very short name improves memorability and buyer appeal.");
  } else if (name.length <= 8) {
    score += 12;
    reasons.push("Compact name supports better brand recall.");
  } else if (name.length <= 12) {
    score += 6;
    reasons.push("Reasonable length keeps the domain usable for branding.");
  } else if (name.length <= 16) {
    score -= 4;
    weaknesses.push("Longer names are harder to brand and resell.");
  } else {
    score -= 10;
    weaknesses.push("Very long names usually reduce resale quality.");
  }

  if (!name.includes("-")) {
    score += 6;
    reasons.push("No hyphens keeps the name cleaner and more premium.");
  } else {
    score -= 10;
    weaknesses.push("Hyphens often reduce trust and aftermarket value.");
  }

  if (!/\d/.test(name)) {
    score += 5;
    reasons.push("No numbers helps with readability and brand credibility.");
  } else {
    score -= 8;
    weaknesses.push("Numbers can make the name harder to remember.");
  }

  if (isBrandable(name)) {
    score += 12;
    reasons.push("The name has solid brandability characteristics.");
  } else {
    score -= 5;
    weaknesses.push("The name has weaker brandability signals.");
  }

  const trendHits = TRENDING_KEYWORDS.filter((keyword) => name.includes(keyword));
  if (trendHits.length > 0) {
    score += Math.min(10, trendHits.length * 4);
    reasons.push(
      `Trending keyword signal detected: ${trendHits
        .map((keyword) => `"${keyword}"`)
        .join(", ")}.`,
    );
  }

  const commercialHits = COMMERCIAL_KEYWORDS.filter((keyword) =>
    name.includes(keyword),
  );
  if (commercialHits.length > 0) {
    score += Math.min(10, commercialHits.length * 5);
    reasons.push(
      "Commercial wording suggests stronger monetization or buyer intent.",
    );
  } else {
    weaknesses.push("Limited commercial intent signals in the current name.");
  }

  const uniqueRatio = uniqueCharactersRatio(name.replace(/\./g, ""));
  if (uniqueRatio >= 0.7) {
    score += 4;
    reasons.push("Character variety supports distinctiveness.");
  } else if (uniqueRatio < 0.45) {
    score -= 4;
    weaknesses.push("Repetitive character patterns can weaken brand clarity.");
  }

  if (name.includes(".")) {
    score -= 4;
    weaknesses.push("Multiple subdomain-like segments reduce brand simplicity.");
  }

  const finalScore = clamp(score, 0, 100);

  return {
    domain: normalized,
    name,
    tld,
    score: finalScore,
    verdict: getVerdict(finalScore),
    riskLevel: getRiskLevel(finalScore),
    reasons,
    weaknesses,
  };
}
