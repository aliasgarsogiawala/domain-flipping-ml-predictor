import { NextResponse } from "next/server";
import {
  analyzeRuleDomain,
  getRiskFromScore,
  scoreRegistrationHistory,
  STRONG_TLDS_MAP,
} from "@/lib/domainAnalyzer";
import { getMockMarketData, type MockMarketData } from "@/lib/mockMarketData";
import { lookupRDAP } from "@/lib/rdap";
import { getMarketplaceStatus } from "@/lib/domainMarketplace";
import { generateInvestmentReport } from "@/lib/investmentReport";
import { predictDomainValueWithMl } from "@/lib/mlPredictor";
import {
  applyAdvisoryValueAdjustment,
  generateOpenAIDomainInsights,
} from "@/lib/openaiDomainAdvisor";
import { generateValueProjection } from "@/lib/valueProjection";
import tldMarketAnchors from "@/data/tldMarketAnchors.json";

type TldMarketAnchor = {
  medianVisibleSaleUsd: number;
  liquidityScore: number;
  trustScore: number;
  resaleMultiplier: number;
};

const DEFAULT_TLD_ANCHOR: TldMarketAnchor = {
  medianVisibleSaleUsd: 320,
  liquidityScore: 24,
  trustScore: 34,
  resaleMultiplier: 0.45,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTldAnchor(tld: string): TldMarketAnchor {
  const anchor = (tldMarketAnchors as Record<string, TldMarketAnchor>)[tld];
  return anchor ?? DEFAULT_TLD_ANCHOR;
}

function adjustEstimatedValue(params: {
  rawEstimatedValueUsd: number;
  mlEstimatedValueUsd?: number | null;
  tld: string;
  score: number;
  investmentScore: number;
  brandPrestigeScore: number;
  marketScore: number;
  riskLevel: "Low" | "Medium" | "High";
  availabilityStatus: "Available" | "Taken" | "Unknown";
  resaleStatus: string;
  premiumSignal: boolean;
  comparableSalesCount: number;
  domainLength: number;
  lowQualitySignal?: boolean;
}) {
  const anchor = getTldAnchor(params.tld);
  const raw = params.rawEstimatedValueUsd;
  const baseEstimate =
    params.mlEstimatedValueUsd && params.mlEstimatedValueUsd > 0
      ? raw * 0.35 + params.mlEstimatedValueUsd * 0.65
      : raw;
  const qualityBlend =
    params.score * 0.32 +
    params.investmentScore * 0.26 +
    params.brandPrestigeScore * 0.22 +
    params.marketScore * 0.2;

  let qualityFactor = 0.55 + qualityBlend / 180;
  if (params.domainLength <= 8) qualityFactor += 0.08;
  else if (params.domainLength >= 14) qualityFactor -= 0.07;
  if (params.premiumSignal) qualityFactor += 0.15;
  if (params.comparableSalesCount >= 3) qualityFactor += 0.08;
  if (params.riskLevel === "High") qualityFactor -= 0.12;
  else if (params.riskLevel === "Medium") qualityFactor -= 0.05;
  if (params.resaleStatus === "needs_verification") qualityFactor -= 0.08;
  if (params.availabilityStatus === "Unknown") qualityFactor -= 0.04;

  qualityFactor = clamp(qualityFactor, 0.35, 1.3);

  const anchorDrivenEstimate =
    anchor.medianVisibleSaleUsd * qualityFactor * anchor.resaleMultiplier;

  // Treat external and ML estimates as one pricing signal, not the dominant answer.
  let adjusted = baseEstimate * 0.35 + anchorDrivenEstimate * 0.65;

  const liquidityCap =
    anchor.medianVisibleSaleUsd * (1.2 + anchor.liquidityScore / 65);
  const floor = anchor.medianVisibleSaleUsd * 0.35;

  adjusted = clamp(adjusted, floor, liquidityCap);

  if (anchor.liquidityScore < 45) {
    adjusted = Math.min(adjusted, anchor.medianVisibleSaleUsd * 1.45);
  }

  if (params.tld !== "com") {
    const comAnchor = getTldAnchor("com");
    const strongSignalGate =
      params.score >= 84 &&
      params.brandPrestigeScore >= 82 &&
      params.marketScore >= 72 &&
      params.comparableSalesCount >= 3;

    if (!strongSignalGate) {
      adjusted = Math.min(adjusted, comAnchor.medianVisibleSaleUsd * 0.95);
    }
  }

  if (params.score < 35) {
    adjusted = Math.min(adjusted, Math.max(180, anchor.medianVisibleSaleUsd * 0.22));
  } else if (params.score < 45 && params.riskLevel === "High") {
    adjusted = Math.min(adjusted, Math.max(260, anchor.medianVisibleSaleUsd * 0.32));
  }

  if (params.lowQualitySignal) {
    adjusted = Math.min(adjusted, Math.max(220, anchor.medianVisibleSaleUsd * 0.28));
  }

  return {
    tldMarketAnchorUsd: anchor.medianVisibleSaleUsd,
    adjustedEstimatedValueUsd: Math.round(adjusted),
    liquidityScore: anchor.liquidityScore,
  };
}

async function computeMarketScore(marketData: MockMarketData) {
  // Simple deterministic mapping to 0-100
  let score = 0;

  if (marketData.premiumSignal) score += 60;

  // comparable sales weight
  score += Math.min(30, (marketData.comparableSalesCount ?? 0) * 6);

  // estimated value contributes moderately
  const est = marketData.estimatedValueUsd ?? 0;
  if (est > 200000) score += 20;
  else if (est > 50000) score += 12;
  else if (est > 10000) score += 6;

  // demand
  if (marketData.marketDemand === "High") score += 10;
  else if (marketData.marketDemand === "Medium") score += 5;

  return Math.min(100, Math.round(score));
}

function scoreMlQualityAdjustment(
  mlPrediction: Awaited<ReturnType<typeof predictDomainValueWithMl>>,
  tld: string,
) {
  const features = mlPrediction?.extractedFeatures;
  if (!features) return 0;

  let adjustment = 0;

  if (
    features.estimatedBrandabilityScore >= 88 &&
    features.pronounceabilityScore >= 72 &&
    features.domainLength <= 8 &&
    features.containsNumber === 0 &&
    features.containsHyphen === 0
  ) {
    adjustment += 4;
  }

  if (features.shortPremiumSignal === 1 && (tld === "com" || tld === "ai")) {
    adjustment += 3;
  }

  if (features.tldTierScore <= 45) {
    adjustment -= 4;
  }

  if (features.pronounceabilityScore <= 30) {
    adjustment -= 5;
  }

  if (features.repeatedCharPenalty >= 20) {
    adjustment -= 2;
  }

  if (features.containsNumber === 1 && features.domainLength >= 10) {
    adjustment -= 3;
  }

  if (features.categoryHint === "brand" && features.uniqueCharRatio >= 0.72) {
    adjustment += 2;
  }

  return clamp(adjustment, -8, 8);
}

function hasLowQualityMlShape(
  mlPrediction: Awaited<ReturnType<typeof predictDomainValueWithMl>>,
) {
  const features = mlPrediction?.extractedFeatures;
  if (!features) return false;

  return (
    features.pronounceabilityScore <= 30 ||
    features.tldTierScore <= 45 ||
    (features.containsNumber === 1 && features.domainLength >= 9) ||
    features.repeatedCharPenalty >= 20
  );
}

function computeBrandPrestigeScore(params: {
  breakdown: {
    brandability: number;
    memorability: number;
    pronounceability: number;
    premiumBrandSignal: number;
  };
  finalScore: number;
  mlPrediction: Awaited<ReturnType<typeof predictDomainValueWithMl>>;
}) {
  const mlBrandability = params.mlPrediction?.extractedFeatures.estimatedBrandabilityScore ?? 50;
  const mlPronounceability = params.mlPrediction?.extractedFeatures.pronounceabilityScore ?? 50;

  let score = Math.round(
    params.breakdown.brandability * 1.8 +
      params.breakdown.memorability * 1.4 +
      params.breakdown.pronounceability * 1.4 +
      params.breakdown.premiumBrandSignal * 1.5 +
      (mlBrandability - 50) * 0.14 +
      (mlPronounceability - 50) * 0.12,
  );

  if (params.finalScore < 40) {
    score = Math.min(score, params.finalScore + 12);
  } else if (params.finalScore < 55) {
    score = Math.min(score, params.finalScore + 16);
  } else if (params.finalScore < 70) {
    score = Math.min(score, params.finalScore + 10);
  } else if (params.finalScore < 85) {
    score = Math.min(score, params.finalScore + 14);
  }

  return clamp(score, 0, 100);
}

function applyPremiumRealityCaps(params: {
  score: number;
  tld: string;
  marketData: MockMarketData;
  mlPrediction: Awaited<ReturnType<typeof predictDomainValueWithMl>>;
  aiInsights: Awaited<ReturnType<typeof generateOpenAIDomainInsights>>;
  availabilityStatus: "Available" | "Taken" | "Unknown";
}) {
  let score = params.score;
  const features = params.mlPrediction?.extractedFeatures;
  const eliteLikeShape =
    Boolean(features) &&
    features.wordCount === 1 &&
    features.domainLength <= 7 &&
    features.containsNumber === 0 &&
    features.containsHyphen === 0 &&
    features.pronounceabilityScore >= 68 &&
    features.categoryHint !== "general";

  const strongAftermarketSupport =
    params.marketData.comparableSalesCount >= 4 &&
    params.aiInsights.aftermarketStrengthScore >= 72 &&
    params.aiInsights.endUserDemandScore >= 70;

  if (!params.aiInsights.eliteWordSignal && !eliteLikeShape) {
    score = Math.min(score, params.tld === "com" ? 88 : 82);
  }

  if (
    params.availabilityStatus === "Available" &&
    params.marketData.comparableSalesCount <= 1 &&
    params.aiInsights.premiumFeelScore < 72
  ) {
    score = Math.min(score, 76);
  }

  if (params.tld !== "com" && !strongAftermarketSupport) {
    score = Math.min(score, 84);
  }

  if (
    params.aiInsights.premiumFeelScore < 58 &&
    params.aiInsights.endUserDemandScore < 56 &&
    params.marketData.comparableSalesCount <= 1
  ) {
    score = Math.min(score, 68);
  }

  return clamp(score, 0, 100);
}

function getRealityCheckedVerdict(params: {
  score: number;
  aiInsights: Awaited<ReturnType<typeof generateOpenAIDomainInsights>>;
  marketData: MockMarketData;
  tld: string;
}) {
  if (
    params.score >= 85 &&
    params.aiInsights.premiumFeelScore >= 80 &&
    (params.aiInsights.eliteWordSignal || params.marketData.comparableSalesCount >= 4) &&
    params.aiInsights.endUserDemandScore >= 72 &&
    params.aiInsights.aftermarketStrengthScore >= 70 &&
    params.tld === "com"
  ) {
    return "Premium Potential" as const;
  }

  if (params.score >= 70) return "High Potential" as const;
  if (params.score >= 50) return "Moderate Potential" as const;
  return "Low Potential" as const;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const domain = (body?.domain ?? "").toString().trim();

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    // Run rule-based analysis
    const rule = analyzeRuleDomain(domain);

    // Market data & RDAP lookup
    const marketData = getMockMarketData(rule.domain);
    const rdap = await lookupRDAP(rule.domain);
    const mlPrediction = await predictDomainValueWithMl(rule.domain);
    const availability = rdap.availabilityStatus;
    rule.breakdown.registrationHistory = scoreRegistrationHistory(
      rdap,
      rule.reasons,
      rule.weaknesses,
    );

    // Marketplace/resale detection
    const marketplace = await getMarketplaceStatus(rule.domain);

    const marketScore = await computeMarketScore(marketData);

    // Combine scores (blend rule and market)
    let final = Math.round(rule.ruleScore * 0.6 + marketScore * 0.4);
    final += rule.breakdown.registrationHistory;

    // Important caps and adjustments
    const compactName = rule.name.replace(/\./g, "");
    const hasHyphenOrNumber = /-|\d/.test(compactName);
    const hasComparables = (marketData.comparableSalesCount ?? 0) > 0;
    const strongMarket = marketData.premiumSignal || (marketData.comparableSalesCount ?? 0) >= 3 || (marketData.estimatedValueUsd ?? 0) >= 50000;

    // If no comparables and no premium signal, cap at 72
    if (!hasComparables && !marketData.premiumSignal) {
      final = Math.min(final, 72);
    }

    // If TLD weak, cap at 65
    const tld = rule.tld;
    if (!STRONG_TLDS_MAP[tld]) {
      final = Math.min(final, 65);
    }

    // If hyphens/numbers, cap at 60 unless strong market
    if (hasHyphenOrNumber && !strongMarket) {
      final = Math.min(final, 60);
    }

    // If premium signal allow 85+
    if (marketData.premiumSignal) {
      final = Math.max(final, 85);
    }

    // If comparables strong, boost
    if (marketData.comparableSalesCount >= 5) {
      final = Math.min(100, final + 6);
    }

    // RDAP can add modest credibility, but should not override weak market/rule signals
    if (availability === "Available") {
      final = Math.min(final, 78);
    }

    if (availability === "Unknown") {
      final = Math.min(final, Math.max(rule.ruleScore, 74));
    }

    if (rdap.expiresAt) {
      const expiresAt = Date.parse(rdap.expiresAt);
      if (!Number.isNaN(expiresAt)) {
        const daysUntilExpiry = (expiresAt - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry > 0 && daysUntilExpiry < 45) {
          rule.weaknesses.push("Registration is close to expiry, which adds uncertainty.");
          final = Math.max(0, final - 2);
        }
      }
    }

    final += scoreMlQualityAdjustment(mlPrediction, rule.tld);

    final = Math.max(0, Math.min(100, final));

    let brandPrestigeScore = computeBrandPrestigeScore({
      breakdown: rule.breakdown,
      finalScore: final,
      mlPrediction,
    });

    let investmentScore = final;

    let valuation = adjustEstimatedValue({
      rawEstimatedValueUsd: marketData.estimatedValueUsd,
      mlEstimatedValueUsd: mlPrediction?.predictedValueUsd ?? null,
      tld: rule.tld,
      score: final,
      investmentScore,
      brandPrestigeScore,
      marketScore,
      riskLevel: getRiskFromScore(final),
      availabilityStatus: availability,
      resaleStatus: marketplace?.resaleStatus ?? "unknown",
      premiumSignal: marketData.premiumSignal,
      comparableSalesCount: marketData.comparableSalesCount,
      domainLength: rule.name.replace(/\./g, "").length,
      lowQualitySignal: hasLowQualityMlShape(mlPrediction),
    });

    const openaiInsights = await generateOpenAIDomainInsights({
      domain: rule.domain,
      name: rule.name,
      tld: rule.tld,
      score: final,
      ruleScore: rule.ruleScore,
      marketScore,
      investmentScore,
      brandPrestigeScore,
      riskLevel: getRiskFromScore(final),
      availabilityStatus: availability,
      resaleStatus: marketplace?.resaleStatus ?? "unknown",
      adjustedEstimatedValueUsd: valuation.adjustedEstimatedValueUsd,
      tldMarketAnchorUsd: valuation.tldMarketAnchorUsd,
      liquidityScore: valuation.liquidityScore,
      registrar: rdap.registrar,
      createdAt: rdap.createdAt,
      expiresAt: rdap.expiresAt,
      reasons: rule.reasons,
      weaknesses: rule.weaknesses,
      comparableSalesCount: marketData.comparableSalesCount,
    });

    final = applyPremiumRealityCaps({
      score: final,
      tld: rule.tld,
      marketData,
      mlPrediction,
      aiInsights: openaiInsights,
      availabilityStatus: availability,
    });

    investmentScore = final;
    brandPrestigeScore = computeBrandPrestigeScore({
      breakdown: rule.breakdown,
      finalScore: final,
      mlPrediction,
    });

    valuation = adjustEstimatedValue({
      rawEstimatedValueUsd: marketData.estimatedValueUsd,
      mlEstimatedValueUsd: mlPrediction?.predictedValueUsd ?? null,
      tld: rule.tld,
      score: final,
      investmentScore,
      brandPrestigeScore,
      marketScore,
      riskLevel: getRiskFromScore(final),
      availabilityStatus: availability,
      resaleStatus: marketplace?.resaleStatus ?? "unknown",
      premiumSignal: marketData.premiumSignal,
      comparableSalesCount: marketData.comparableSalesCount,
      domainLength: rule.name.replace(/\./g, "").length,
      lowQualitySignal: hasLowQualityMlShape(mlPrediction),
    });

    let aiAdjustedEstimatedValueUsd = applyAdvisoryValueAdjustment(
      valuation.adjustedEstimatedValueUsd,
      openaiInsights,
    );

    if (final < 40) {
      aiAdjustedEstimatedValueUsd = Math.min(
        aiAdjustedEstimatedValueUsd,
        Math.max(180, valuation.tldMarketAnchorUsd * 0.24),
      );
    } else if (final < 55) {
      aiAdjustedEstimatedValueUsd = Math.min(
        aiAdjustedEstimatedValueUsd,
        Math.max(320, valuation.tldMarketAnchorUsd * 0.4),
      );
    }

    const investmentReport = generateInvestmentReport({
      domain: rule.domain,
      name: rule.name,
      tld: rule.tld,
      score: final,
      investmentScore,
      brandPrestigeScore,
      availabilityStatus: availability,
      resaleStatus: marketplace?.resaleStatus ?? "unknown",
      estimatedValueUsd: aiAdjustedEstimatedValueUsd,
      registrar: rdap.registrar,
      createdAt: rdap.createdAt,
      expiresAt: rdap.expiresAt,
      reasons: rule.reasons,
      weaknesses: rule.weaknesses,
      riskLevel: getRiskFromScore(final),
      comparableSalesCount: marketData.comparableSalesCount,
    });

    const valueProjection = generateValueProjection({
      estimatedValueUsd: aiAdjustedEstimatedValueUsd,
      score: final,
      investmentScore,
      brandPrestigeScore,
      marketScore,
      riskLevel: getRiskFromScore(final),
      tld: rule.tld,
      domainLength: rule.name.replace(/\./g, "").length,
      availabilityStatus: availability,
      resaleStatus: marketplace?.resaleStatus ?? "unknown",
    });

    const response = {
      domain: rule.domain,
      name: rule.name,
      tld: rule.tld,
      score: final,
      investmentScore,
      brandPrestigeScore,
      ruleScore: rule.ruleScore,
      marketScore,
      availabilityStatus: availability,
      estimatedValueUsd: marketData.estimatedValueUsd,
      mlPredictedValueUsd: mlPrediction?.predictedValueUsd ?? null,
      mlPredictionConfidence: mlPrediction?.confidence ?? null,
      mlExtractedFeatures: mlPrediction?.extractedFeatures ?? null,
      tldMarketAnchorUsd: valuation.tldMarketAnchorUsd,
      modelAdjustedEstimatedValueUsd: valuation.adjustedEstimatedValueUsd,
      adjustedEstimatedValueUsd: aiAdjustedEstimatedValueUsd,
      liquidityScore: valuation.liquidityScore,
      comparableSalesCount: marketData.comparableSalesCount,
      rdap,
      breakdown: rule.breakdown,
      verdict: getRealityCheckedVerdict({
        score: final,
        aiInsights: openaiInsights,
        marketData,
        tld: rule.tld,
      }),
      riskLevel: getRiskFromScore(final),
      reasons: rule.reasons,
      weaknesses: rule.weaknesses,
      marketData,
      marketplaceStatus: marketplace?.status ?? "unknown",
      marketplaceName: marketplace?.marketplaceName ?? null,
      askingPrice: marketplace?.askingPrice ?? null,
      landingPageDetected: marketplace?.landingPageDetected ?? false,
      resaleStatus: marketplace?.resaleStatus ?? "unknown",
      detectedMarketplace: marketplace?.detectedMarketplace ?? null,
      resaleConfidence: marketplace?.confidence ?? null,
      marketplaceLinks: marketplace?.marketplaceLinks ?? null,
      marketplaceNotes: marketplace?.notes ?? null,
      openaiInsights,
      investmentReport,
      valueProjection,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Unable to analyze domain" }, { status: 500 });
  }
}
