/**
 * Domain Valuation Engine
 * 
 * Improves base market estimates with:
 * - TLD market weight system (liquidity tiers)
 * - Domain score integration
 * - Sanity checks (prevent ccTLD overpricing vs .com)
 * - Liquidity multipliers
 */

// TLD market weight: how much liquidity and market depth
const TLD_MARKET_WEIGHTS: Record<string, number> = {
  "com": 1.0,      // baseline, highest liquidity
  "ai": 0.9,       // high growth, strong liquidity
  "io": 0.85,      // strong startup market
  "co": 0.80,      // .com alternative
  "net": 0.75,
  "org": 0.75,
  "dev": 0.70,     // modern but smaller market
  "app": 0.70,
  "tech": 0.65,
  "xyz": 0.60,
  "online": 0.60,
  "site": 0.55,
  "in": 0.50,      // ccTLD, limited global liquidity
  "co.uk": 0.45,   // ccTLD
  "co.in": 0.45,   // ccTLD
  "uk": 0.40,      // ccTLD
  "de": 0.40,      // ccTLD
  "fr": 0.40,      // ccTLD
  "jp": 0.35,      // ccTLD
};

function getTldWeight(tld: string): number {
  const normalized = tld.toLowerCase();
  return TLD_MARKET_WEIGHTS[normalized] ?? 0.5; // default conservative weight
}

function extractTld(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  if (parts.length > 2 && (parts[parts.length - 2] === "co" || parts[parts.length - 2] === "com")) {
    // Handle co.uk, co.in, com.au etc
    return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  }
  return parts[parts.length - 1] || "unknown";
}

interface ValuationContext {
  domainScore: number;          // 0-100 domain quality score
  brandPrestigeScore: number;   // 0-100 brand signal strength
  ruleScore: number;            // 0-100 rule-based score
  rawApiEstimateUsd: number;    // base GoDaddy-style estimate
}

interface AdjustedValuation {
  rawApiEstimateUsd: number;
  adjustedEstimatedValueUsd: number;
  tldWeight: number;
  liquidityMultiplier: number;
  normalizationReason?: string;
}

/**
 * Apply TLD weighting, liquidity adjustment, and sanity checks
 * to normalize domain valuations across different extensions.
 */
export function calculateAdjustedValuation(
  domain: string,
  context: ValuationContext
): AdjustedValuation {
  const tld = extractTld(domain);
  const tldWeight = getTldWeight(tld);
  
  // Start with the raw API estimate
  let adjusted = context.rawApiEstimateUsd;
  let normalizationReason = "";

  // 1. Apply TLD weight (domains with lower liquidity get reduced valuation)
  adjusted = adjusted * tldWeight;

  // 2. Apply liquidity multiplier based on domain score
  // Better domains in liquid markets get a boost; weaker ones get reduced
  const qualityMultiplier = 0.8 + (context.domainScore / 100) * 0.4; // range: 0.8 to 1.2
  adjusted = adjusted * qualityMultiplier;

  // 3. Sanity check: prevent ccTLD overpricing vs .com
  // If this is a ccTLD and significantly outprices the equivalent .com, cap it
  const isCcTld = tldWeight <= 0.5;
  if (isCcTld && tldWeight < 1.0) {
    // For ccTLDs, estimate what equivalent .com would be worth
    const estimatedComValue = context.rawApiEstimateUsd * (1.0 / tldWeight); // normalize to .com equivalent
    
    // If adjusted value exceeds 1.5x the equivalent .com without strong premium signals, cap it
    const hasPremiumSignal = context.brandPrestigeScore >= 75 && context.ruleScore >= 75;
    if (adjusted > estimatedComValue * 1.5 && !hasPremiumSignal) {
      adjusted = estimatedComValue * 1.0; // Align with .com equivalent
      normalizationReason = `Normalized from inflated ${tld} valuation to match .com equivalent`;
    }
  }

  // 4. Floor/ceiling constraints
  // Very low valuations below $100 get a floor (minimal resale value)
  if (adjusted < 100) {
    adjusted = Math.max(100, adjusted);
  }
  // Very high outliers capped at reasonable portfolio value (unless premium signal)
  if (adjusted > 500_000 && context.brandPrestigeScore < 90) {
    adjusted = Math.min(adjusted, 500_000);
    normalizationReason = "Capped to realistic portfolio range";
  }

  const result: AdjustedValuation = {
    rawApiEstimateUsd: Math.round(context.rawApiEstimateUsd),
    adjustedEstimatedValueUsd: Math.round(adjusted),
    tldWeight,
    liquidityMultiplier: qualityMultiplier,
  };

  if (normalizationReason) {
    result.normalizationReason = normalizationReason;
  }

  return result;
}

/**
 * Get readable description of valuation tier
 */
export function getValuationTier(valueUsd: number): string {
  if (valueUsd >= 100_000) return "Premium";
  if (valueUsd >= 50_000) return "High Value";
  if (valueUsd >= 10_000) return "Moderate";
  if (valueUsd >= 2_000) return "Entry-level";
  if (valueUsd >= 500) return "Speculative";
  return "Minimal";
}

/**
 * Get confidence rating for valuation (lower adjusted delta = higher confidence)
 */
export function getValuationConfidence(raw: number, adjusted: number): "High" | "Medium" | "Low" {
  const delta = Math.abs(raw - adjusted) / Math.max(raw, 1);
  if (delta < 0.1) return "High";      // <10% adjustment
  if (delta < 0.3) return "Medium";    // <30% adjustment
  return "Low";                         // >30% adjustment
}
