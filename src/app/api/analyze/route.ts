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
import { findComparableSales } from "@/lib/marketData";
import { predictDomainValueWithMl, type MlPredictionResult } from "@/lib/mlPredictor";
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

const analysisCache = new Map<string, { result: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCachedAnalysis(domain: string) {
  const entry = analysisCache.get(domain);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    analysisCache.delete(domain);
    return null;
  }
  return entry.result;
}

function setCachedAnalysis(domain: string, result: unknown) {
  if (analysisCache.size > 500) {
    const firstKey = analysisCache.keys().next().value;
    if (firstKey !== undefined) analysisCache.delete(firstKey);
  }
  analysisCache.set(domain, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

const DEFAULT_TLD_ANCHOR: TldMarketAnchor = {
  medianVisibleSaleUsd: 320,
  liquidityScore: 24,
  trustScore: 34,
  resaleMultiplier: 0.45,
};

const EXCEPTIONAL_BRAND_NAMES = new Set([
  "google",
  "openai",
  "stripe",
  "uber",
  "figma",
  "linear",
  "notion",
  "github",
  "amazon",
  "apple",
  "netflix",
  "tesla",
  "oracle",
  "meta",
  "adobe",
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTldAnchor(tld: string): TldMarketAnchor {
  const anchor = (tldMarketAnchors as Record<string, TldMarketAnchor>)[tld];
  return anchor ?? DEFAULT_TLD_ANCHOR;
}

function hasExceptionalBrandSignal(name: string) {
  const compact = name.toLowerCase().replace(/[^a-z]/g, "");
  return compact.length > 0 && EXCEPTIONAL_BRAND_NAMES.has(compact);
}

type ComparableSalesSummary = {
  count: number;
  averageSimilarity: number;
  medianSaleUsd: number | null;
  weightedMedianSaleUsd: number | null;
  strongestSaleUsd: number | null;
};

function computeMedian(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return Math.round(sorted[middle]);
}

function computeWeightedMedian(items: Array<{ value: number; weight: number }>) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((left, right) => left.value - right.value);
  const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);
  let runningWeight = 0;

  for (const item of sorted) {
    runningWeight += item.weight;
    if (runningWeight >= totalWeight / 2) {
      return Math.round(item.value);
    }
  }

  return Math.round(sorted.at(-1)?.value ?? 0);
}

function summarizeComparableSales(comparableSales: Awaited<ReturnType<typeof findComparableSales>>) {
  if (comparableSales.length === 0) {
    return {
      count: 0,
      averageSimilarity: 0,
      medianSaleUsd: null,
      weightedMedianSaleUsd: null,
      strongestSaleUsd: null,
    } satisfies ComparableSalesSummary;
  }

  const prices = comparableSales.map((record) => record.salePriceUsd);
  const weightedMedianSaleUsd = computeWeightedMedian(
    comparableSales.map((record) => ({
      value: record.salePriceUsd,
      weight: clamp(record.similarityScore / 100, 0.3, 0.95),
    })),
  );

  return {
    count: comparableSales.length,
    averageSimilarity: Math.round(
      comparableSales.reduce((sum, record) => sum + record.similarityScore, 0) /
        comparableSales.length,
    ),
    medianSaleUsd: computeMedian(prices),
    weightedMedianSaleUsd,
    strongestSaleUsd: Math.max(...prices),
  } satisfies ComparableSalesSummary;
}

function getMlConfidenceWeight(
  confidence: MlPredictionResult["confidence"] | null | undefined,
) {
  if (confidence === "High") return 0.62;
  if (confidence === "Medium") return 0.48;
  return 0.34;
}

function getPricingConfidence(params: {
  mlConfidence: MlPredictionResult["confidence"] | null | undefined;
  comparableSales: ComparableSalesSummary;
  score: number;
  availabilityStatus: "Available" | "Taken" | "Unknown";
}) {
  if (
    params.mlConfidence === "High" &&
    params.comparableSales.count >= 3 &&
    params.comparableSales.averageSimilarity >= 56
  ) {
    return "High" as const;
  }

  if (
    params.mlConfidence === "Medium" ||
    params.comparableSales.count >= 2 ||
    (params.score >= 72 && params.availabilityStatus !== "Unknown")
  ) {
    return "Medium" as const;
  }

  return "Low" as const;
}

function mapAdvisorConfidence(
  confidence: Awaited<ReturnType<typeof generateOpenAIDomainInsights>>["confidence"],
): MlPredictionResult["confidence"] {
  if (confidence === "High") return "High";
  if (confidence === "Medium") return "Medium";
  return "Low";
}

function deriveAiInitialEstimate(params: {
  currentEstimateUsd: number;
  rawEstimatedValueUsd: number;
  tldAnchorUsd: number;
  comparableSalesSummary: ComparableSalesSummary;
  aiInsights: Awaited<ReturnType<typeof generateOpenAIDomainInsights>>;
  score: number;
  tld: string;
  availabilityStatus: "Available" | "Taken" | "Unknown";
  exceptionalBrandSignal?: boolean;
}) {
  const comparableReference =
    params.comparableSalesSummary.weightedMedianSaleUsd ??
    params.comparableSalesSummary.medianSaleUsd;
  const aiStrength =
    params.aiInsights.premiumFeelScore * 0.34 +
    params.aiInsights.endUserDemandScore * 0.36 +
    params.aiInsights.aftermarketStrengthScore * 0.3;

  const comparableComponent = comparableReference
    ? comparableReference *
      clamp(
        0.22 +
          params.aiInsights.endUserDemandScore / 180 +
          params.comparableSalesSummary.averageSimilarity / 220,
        0.18,
        params.exceptionalBrandSignal ? 1.18 : 0.82,
      )
    : 0;

  const anchorComponent =
    params.tldAnchorUsd *
    clamp(
      0.04 +
        params.score / 230 +
        params.aiInsights.premiumFeelScore / 420 +
        params.aiInsights.aftermarketStrengthScore / 420,
      0.06,
      params.exceptionalBrandSignal ? 1.1 : 0.42,
    );

  const heuristicComponent =
    params.currentEstimateUsd * 0.46 + params.rawEstimatedValueUsd * 0.18 + anchorComponent * 0.36;

  let estimate =
    comparableComponent > 0
      ? (heuristicComponent * 0.48 + comparableComponent * 0.52)
      : heuristicComponent;

  if (params.availabilityStatus === "Available" && params.comparableSalesSummary.count <= 1 && !params.exceptionalBrandSignal) {
    estimate *= params.tld === "com" ? 0.76 : 0.56;
  }
  if (params.tld === "in" && !params.exceptionalBrandSignal) {
    estimate *= params.availabilityStatus === "Taken" ? 0.84 : 0.68;
    if (aiStrength < 64) estimate *= 0.8;
  }
  if (params.exceptionalBrandSignal) {
    estimate = Math.max(
      estimate,
      comparableReference
        ? comparableReference * 0.68
        : params.tldAnchorUsd * (params.tld === "in" ? 0.92 : 1.04),
    );
  }

  return Math.max(0, Math.round(estimate));
}

function adjustEstimatedValue(params: {
  rawEstimatedValueUsd: number;
  mlEstimatedValueUsd?: number | null;
  mlPredictionConfidence?: MlPredictionResult["confidence"] | null;
  mlPronounceabilityScore?: number | null;
  mlCategoryHint?: string | null;
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
  comparableSalesSummary: ComparableSalesSummary;
  domainLength: number;
  lowQualitySignal?: boolean;
  exceptionalBrandSignal?: boolean;
}) {
  const anchor = getTldAnchor(params.tld);
  const raw = params.rawEstimatedValueUsd;
  const qualityBlend =
    params.score * 0.32 +
    params.investmentScore * 0.26 +
    params.brandPrestigeScore * 0.22 +
    params.marketScore * 0.2;
  const mlBaseline =
    params.mlEstimatedValueUsd && params.mlEstimatedValueUsd > 0 ? params.mlEstimatedValueUsd : null;
  const mlPronounceabilityScore = params.mlPronounceabilityScore ?? 50;
  const mlCategoryHint = params.mlCategoryHint ?? "general";
  const qualityIndex = clamp(qualityBlend / 100, 0.18, 1);
  const comparableEvidence =
    params.comparableSalesSummary.count === 0
      ? 0
      : clamp(
          params.comparableSalesSummary.count * 0.16 +
            params.comparableSalesSummary.averageSimilarity / 140,
          0.12,
          0.78,
        );

  let anchorExposure =
    0.02 +
    params.score / 220 +
    params.marketScore / 420 +
    params.brandPrestigeScore / 460 +
    comparableEvidence * 0.24;

  if (params.premiumSignal) anchorExposure += 0.06;
  if (params.domainLength <= 8) anchorExposure += 0.04;
  else if (params.domainLength >= 14) anchorExposure -= 0.05;
  if (params.riskLevel === "High") anchorExposure -= 0.11;
  else if (params.riskLevel === "Medium") anchorExposure -= 0.05;
  if (params.resaleStatus === "needs_verification") anchorExposure -= 0.05;
  if (params.availabilityStatus === "Available" && params.comparableSalesCount <= 1) {
    anchorExposure -= 0.14;
  }
  if (params.tld === "in" && params.availabilityStatus !== "Taken" && !params.exceptionalBrandSignal) {
    anchorExposure -= params.comparableSalesCount >= 3 ? 0.08 : 0.15;
  }
  if (params.lowQualitySignal) {
    anchorExposure -= 0.14;
  }
  if (params.tld === "in" && !params.exceptionalBrandSignal && mlPronounceabilityScore < 62) {
    anchorExposure -= 0.08;
  }

  anchorExposure = clamp(anchorExposure, 0.015, 0.92);

  const anchorDrivenEstimate = anchor.medianVisibleSaleUsd * anchor.resaleMultiplier * anchorExposure;
  const comparableReference =
    params.comparableSalesSummary.weightedMedianSaleUsd ??
    params.comparableSalesSummary.medianSaleUsd;

  let comparableQualityShare =
    0.12 +
    qualityIndex * 0.52 +
    params.brandPrestigeScore / 280 +
    params.marketScore / 340;

  if (params.availabilityStatus === "Available" && params.comparableSalesCount <= 1) {
    comparableQualityShare -= 0.18;
  }
  if (params.riskLevel === "High") comparableQualityShare -= 0.12;
  if (params.lowQualitySignal) comparableQualityShare -= 0.16;
  if (params.tld !== "com" && params.comparableSalesCount < 3 && !params.exceptionalBrandSignal) {
    comparableQualityShare -= 0.1;
  }
  if (params.tld === "in" && !params.exceptionalBrandSignal) {
    comparableQualityShare -= params.comparableSalesCount >= 4 ? 0.08 : 0.18;
  }
  if (mlCategoryHint === "brand" && mlPronounceabilityScore < 60 && !params.exceptionalBrandSignal) {
    comparableQualityShare -= 0.08;
  }

  comparableQualityShare = clamp(comparableQualityShare, 0.08, 0.94);

  const comparableDrivenEstimate = comparableReference
    ? comparableReference * comparableQualityShare
    : null;

  const mlWeight = mlBaseline ? getMlConfidenceWeight(params.mlPredictionConfidence) : 0;
  const comparableWeight = comparableDrivenEstimate ? comparableEvidence : 0;
  const anchorWeight = anchorExposure * 0.5;
  const heuristicWeight = 0.18;
  const totalWeight = mlWeight + comparableWeight + anchorWeight + heuristicWeight;

  let adjusted =
    ((mlBaseline ?? raw) * mlWeight +
      (comparableDrivenEstimate ?? 0) * comparableWeight +
      anchorDrivenEstimate * anchorWeight +
      raw * heuristicWeight) /
    totalWeight;

  if (params.availabilityStatus === "Available" && params.comparableSalesCount === 0) {
    adjusted *= params.tld === "com" ? 0.56 : 0.42;
  } else if (params.availabilityStatus === "Available" && params.comparableSalesCount === 1) {
    adjusted *= params.tld === "com" ? 0.72 : 0.58;
  }
  if (params.tld === "in" && !params.exceptionalBrandSignal) {
    adjusted *= params.availabilityStatus === "Taken" ? 0.82 : 0.66;
    if (mlPronounceabilityScore < 62) adjusted *= 0.84;
    if (params.comparableSalesCount <= 1) adjusted *= 0.8;
  }

  if (params.lowQualitySignal) adjusted *= 0.62;
  if (params.score < 40) adjusted *= 0.58;
  else if (params.score < 50) adjusted *= 0.72;
  if (params.riskLevel === "High") adjusted *= 0.78;
  if (params.resaleStatus === "unknown" && params.availabilityStatus !== "Taken") adjusted *= 0.92;

  const floor =
    mlBaseline && params.score >= 68
      ? Math.max(25, mlBaseline * 0.42)
      : params.score >= 80
        ? anchor.medianVisibleSaleUsd * 0.07
        : params.score >= 65
          ? anchor.medianVisibleSaleUsd * 0.03
          : params.score >= 50
            ? anchor.medianVisibleSaleUsd * 0.015
            : 15;
  const effectiveFloor =
    params.tld === "in" && !params.exceptionalBrandSignal
      ? Math.min(floor, 120)
      : floor;

  let softCap =
    anchor.medianVisibleSaleUsd *
    clamp(
      0.08 +
        params.score / 110 +
        params.brandPrestigeScore / 230 +
        params.marketScore / 260 +
        comparableEvidence * 0.34,
      0.16,
      1.18,
    );

  if (params.availabilityStatus === "Available" && params.comparableSalesCount <= 1) {
    softCap *= params.tld === "com" ? 0.62 : 0.42;
  }
  if (params.tld === "in" && params.availabilityStatus !== "Taken" && !params.exceptionalBrandSignal) {
    softCap *= params.comparableSalesCount >= 4 ? 0.68 : 0.42;
  }
  if (params.tld === "in" && params.availabilityStatus === "Taken" && !params.exceptionalBrandSignal) {
    softCap *= params.comparableSalesCount >= 4 ? 0.82 : 0.56;
  }
  if (params.tld === "in" && !params.exceptionalBrandSignal && mlPronounceabilityScore < 62) {
    softCap *= 0.76;
  }
  if (params.lowQualitySignal) softCap *= 0.54;
  if (params.riskLevel === "High") softCap *= 0.76;

  if (params.tld !== "com") {
    const comAnchor = getTldAnchor("com");
    const strongSignalGate =
      params.score >= 84 &&
      params.brandPrestigeScore >= 82 &&
      params.marketScore >= 72 &&
      params.comparableSalesCount >= 3;

    if (!strongSignalGate && !params.exceptionalBrandSignal) {
      softCap = Math.min(softCap, comAnchor.medianVisibleSaleUsd * 0.82);
    }
  }

  if (params.exceptionalBrandSignal) {
    adjusted *= 1.35;
    softCap = Math.max(softCap, anchor.medianVisibleSaleUsd * (params.tld === "com" ? 1.2 : params.tld === "in" ? 0.96 : 0.86));
  }

  adjusted = clamp(adjusted, effectiveFloor, Math.max(effectiveFloor, softCap));

  return {
    tldMarketAnchorUsd: anchor.medianVisibleSaleUsd,
    adjustedEstimatedValueUsd: Math.round(adjusted),
    liquidityScore: anchor.liquidityScore,
  };
}

function computeMarketScore(marketData: MockMarketData) {
  let score = 0;

  if (marketData.premiumSignal) score += 60;

  score += Math.min(30, (marketData.comparableSalesCount ?? 0) * 6);

  const est = marketData.estimatedValueUsd ?? 0;
  if (est > 200000) score += 20;
  else if (est > 50000) score += 12;
  else if (est > 10000) score += 6;

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

function applyExceptionalBrandAdjustment(params: {
  score: number;
  brandPrestigeScore: number;
  exceptionalBrandSignal: boolean;
  tld: string;
  availabilityStatus: "Available" | "Taken" | "Unknown";
}) {
  if (!params.exceptionalBrandSignal) {
    return {
      score: params.score,
      brandPrestigeScore: params.brandPrestigeScore,
    };
  }

  const scoreFloor =
    params.tld === "com"
      ? 86
      : params.tld === "in"
        ? 78
        : 74;

  const prestigeFloor = params.tld === "com" ? 92 : 84;

  return {
    score:
      params.availabilityStatus === "Unknown"
        ? Math.max(params.score, scoreFloor - 4)
        : Math.max(params.score, scoreFloor),
    brandPrestigeScore: Math.max(params.brandPrestigeScore, prestigeFloor),
  };
}

function applyPremiumRealityCaps(params: {
  score: number;
  tld: string;
  marketData: MockMarketData;
  mlPrediction: Awaited<ReturnType<typeof predictDomainValueWithMl>>;
  aiInsights: Awaited<ReturnType<typeof generateOpenAIDomainInsights>>;
  availabilityStatus: "Available" | "Taken" | "Unknown";
  exceptionalBrandSignal?: boolean;
}) {
  let score = params.score;
  const features = params.mlPrediction?.extractedFeatures;
  const eliteLikeShape = features
    ? features.wordCount === 1 &&
      features.domainLength <= 7 &&
      features.containsNumber === 0 &&
      features.containsHyphen === 0 &&
      features.pronounceabilityScore >= 68 &&
      features.categoryHint !== "general"
    : false;

  const strongAftermarketSupport =
    params.marketData.comparableSalesCount >= 4 &&
    params.aiInsights.aftermarketStrengthScore >= 72 &&
    params.aiInsights.endUserDemandScore >= 70;

  if (!params.aiInsights.eliteWordSignal && !eliteLikeShape && !params.exceptionalBrandSignal) {
    score = Math.min(score, params.tld === "com" ? 82 : 70);
  }

  if (
    params.availabilityStatus === "Available" &&
    params.marketData.comparableSalesCount <= 1 &&
    params.aiInsights.premiumFeelScore < 72 &&
    !params.exceptionalBrandSignal
  ) {
    score = Math.min(score, params.tld === "com" ? 68 : 56);
  }

  if (params.tld !== "com" && !strongAftermarketSupport && !params.exceptionalBrandSignal) {
    score = Math.min(score, 76);
  }

  if (
    params.tld === "in" &&
    params.availabilityStatus !== "Taken" &&
    params.marketData.comparableSalesCount <= 2 &&
    !params.exceptionalBrandSignal
  ) {
    score = Math.min(score, 58);
  }

  if (
    params.aiInsights.premiumFeelScore < 58 &&
    params.aiInsights.endUserDemandScore < 56 &&
    params.marketData.comparableSalesCount <= 1 &&
    !params.exceptionalBrandSignal
  ) {
    score = Math.min(score, 62);
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
    params.score >= 90 &&
    params.aiInsights.premiumFeelScore >= 84 &&
    (params.aiInsights.eliteWordSignal || params.marketData.comparableSalesCount >= 4) &&
    params.aiInsights.endUserDemandScore >= 78 &&
    params.aiInsights.aftermarketStrengthScore >= 74 &&
    params.tld === "com"
  ) {
    return "Premium Potential" as const;
  }

  if (params.score >= 70) return "High Potential" as const;
  if (params.score >= 50) return "Moderate Potential" as const;
  return "Low Potential" as const;
}

function capAdvisoryAdjustedValue(params: {
  baseValueUsd: number;
  verdict: "Low Potential" | "Moderate Potential" | "High Potential" | "Premium Potential";
  score: number;
  tld: string;
  availabilityStatus: "Available" | "Taken" | "Unknown";
  comparableSalesCount: number;
  comparableSalesSummary: ComparableSalesSummary;
  mlPrediction: Awaited<ReturnType<typeof predictDomainValueWithMl>>;
  anchorUsd: number;
  aiInsights: Awaited<ReturnType<typeof generateOpenAIDomainInsights>>;
  exceptionalBrandSignal?: boolean;
}) {
  let value = params.baseValueUsd;

  const mlBaseline = params.mlPrediction?.predictedValueUsd ?? null;
  const compReference =
    params.comparableSalesSummary.weightedMedianSaleUsd ??
    params.comparableSalesSummary.medianSaleUsd;
  const aiStrength =
    params.aiInsights.premiumFeelScore * 0.34 +
    params.aiInsights.endUserDemandScore * 0.36 +
    params.aiInsights.aftermarketStrengthScore * 0.3;

  const referenceCeiling = Math.max(
    30,
    (mlBaseline ?? 0) * 1.15,
    (compReference ?? 0) *
      clamp(
        0.1 +
          params.score / 135 +
          params.aiInsights.premiumFeelScore / 260 +
          params.aiInsights.aftermarketStrengthScore / 300,
        0.16,
        params.verdict === "Premium Potential" ? 1.12 : 0.92,
      ),
    params.anchorUsd *
      clamp(
        0.015 +
          params.score / 230 +
          params.aiInsights.premiumFeelScore / 420 +
          params.comparableSalesCount * 0.03,
        0.04,
        params.verdict === "Premium Potential" ? 1.02 : 0.66,
      ),
  );

  let softCeiling = referenceCeiling;

  if (params.verdict === "Low Potential") {
    softCeiling *= 0.72;
  } else if (params.verdict === "Moderate Potential") {
    softCeiling *= 0.92;
  } else if (params.verdict === "High Potential") {
    softCeiling *= params.tld === "com" ? 1.02 : 0.88;
  }

  if (
    params.availabilityStatus === "Available" &&
    params.comparableSalesCount <= 1 &&
    !params.exceptionalBrandSignal
  ) {
    softCeiling *= params.tld === "com" ? 0.7 : 0.52;
  }
  if (params.tld === "in" && params.availabilityStatus !== "Taken" && !params.exceptionalBrandSignal) {
    softCeiling *= 0.72;
  }
  if (aiStrength < 42) softCeiling *= 0.72;
  else if (aiStrength < 58) softCeiling *= 0.84;

  if (params.exceptionalBrandSignal) {
    softCeiling = Math.max(softCeiling, (compReference ?? params.anchorUsd) * 0.72);
  }

  value = Math.min(value, softCeiling);

  return Math.max(0, Math.round(value));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const domain = (body?.domain ?? "").toString().trim();

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    const cached = getCachedAnalysis(domain);
    if (cached) {
      return NextResponse.json(cached);
    }

    const rule = analyzeRuleDomain(domain);
    const exceptionalBrandSignal = hasExceptionalBrandSignal(rule.name);

    const marketData = getMockMarketData(rule.domain);
    const [comparableSales, rdap, mlPrediction, marketplace] = await Promise.all([
      findComparableSales(rule.domain, 5),
      lookupRDAP(rule.domain),
      predictDomainValueWithMl(rule.domain),
      getMarketplaceStatus(rule.domain),
    ]);
    const comparableSalesSummary = summarizeComparableSales(comparableSales);
    const enrichedMarketData: MockMarketData = {
      ...marketData,
      comparableSalesCount: Math.max(marketData.comparableSalesCount, comparableSalesSummary.count),
    };
    const availability = rdap.availabilityStatus;
    rule.breakdown.registrationHistory = scoreRegistrationHistory(
      rdap,
      rule.reasons,
      rule.weaknesses,
    );

    const marketScore = computeMarketScore(enrichedMarketData);

    let final = Math.round(rule.ruleScore * 0.6 + marketScore * 0.4);
    final += rule.breakdown.registrationHistory;

    const compactName = rule.name.replace(/\./g, "");
    const hasHyphenOrNumber = /-|\d/.test(compactName);
    const hasComparables = enrichedMarketData.comparableSalesCount > 0;
    const strongMarket =
      enrichedMarketData.premiumSignal ||
      enrichedMarketData.comparableSalesCount >= 4 ||
      rule.ruleScore >= 76;

    if (!hasComparables && !enrichedMarketData.premiumSignal) {
      final = Math.min(final, 64);
    }

    const tld = rule.tld;
    if (!STRONG_TLDS_MAP[tld]) {
      final = Math.min(final, 65);
    }

    if (hasHyphenOrNumber && !strongMarket) {
      final = Math.min(final, 60);
    }

    if (enrichedMarketData.premiumSignal && rule.ruleScore >= 78 && availability === "Taken") {
      final = Math.min(100, final + 4);
    }

    if (enrichedMarketData.comparableSalesCount >= 5 && rule.ruleScore >= 68) {
      final = Math.min(100, final + 4);
    }

    if (availability === "Available" && !exceptionalBrandSignal) {
      final = Math.min(final, rule.tld === "com" ? 68 : 60);
    }

    if (availability === "Unknown") {
      final = Math.min(final, Math.max(rule.ruleScore, 66));
    }

    if (
      availability === "Available" &&
      enrichedMarketData.comparableSalesCount <= 1 &&
      !exceptionalBrandSignal
    ) {
      final = Math.min(final, rule.tld === "com" ? 66 : 58);
    }

    if (
      rule.tld === "in" &&
      availability !== "Taken" &&
      enrichedMarketData.comparableSalesCount <= 2 &&
      !exceptionalBrandSignal
    ) {
      final = Math.min(final, 58);
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
    const initialBrandAdjustment = applyExceptionalBrandAdjustment({
      score: final,
      brandPrestigeScore,
      exceptionalBrandSignal,
      tld: rule.tld,
      availabilityStatus: availability,
    });
    final = initialBrandAdjustment.score;
    brandPrestigeScore = initialBrandAdjustment.brandPrestigeScore;

    let investmentScore = final;

    let valuation = adjustEstimatedValue({
      rawEstimatedValueUsd: enrichedMarketData.estimatedValueUsd,
      mlEstimatedValueUsd: mlPrediction?.predictedValueUsd ?? null,
      mlPredictionConfidence: mlPrediction?.confidence ?? null,
      mlPronounceabilityScore: mlPrediction?.extractedFeatures.pronounceabilityScore ?? null,
      mlCategoryHint: mlPrediction?.extractedFeatures.categoryHint ?? null,
      tld: rule.tld,
      score: final,
      investmentScore,
      brandPrestigeScore,
      marketScore,
      riskLevel: getRiskFromScore(final),
      availabilityStatus: availability,
      resaleStatus: marketplace?.resaleStatus ?? "unknown",
      premiumSignal: enrichedMarketData.premiumSignal,
      comparableSalesCount: comparableSalesSummary.count,
      comparableSalesSummary,
      domainLength: rule.name.replace(/\./g, "").length,
      lowQualitySignal: hasLowQualityMlShape(mlPrediction),
      exceptionalBrandSignal,
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
      comparableSalesCount: comparableSalesSummary.count,
    });

    const aiInitialEstimateUsd = deriveAiInitialEstimate({
      currentEstimateUsd: valuation.adjustedEstimatedValueUsd,
      rawEstimatedValueUsd: enrichedMarketData.estimatedValueUsd,
      tldAnchorUsd: valuation.tldMarketAnchorUsd,
      comparableSalesSummary,
      aiInsights: openaiInsights,
      score: final,
      tld: rule.tld,
      availabilityStatus: availability,
      exceptionalBrandSignal,
    });

    final = applyPremiumRealityCaps({
      score: final,
      tld: rule.tld,
      marketData: enrichedMarketData,
      mlPrediction,
      aiInsights: openaiInsights,
      availabilityStatus: availability,
      exceptionalBrandSignal,
    });

    investmentScore = final;
    brandPrestigeScore = computeBrandPrestigeScore({
      breakdown: rule.breakdown,
      finalScore: final,
      mlPrediction,
    });
    const finalBrandAdjustment = applyExceptionalBrandAdjustment({
      score: final,
      brandPrestigeScore,
      exceptionalBrandSignal,
      tld: rule.tld,
      availabilityStatus: availability,
    });
    final = finalBrandAdjustment.score;
    brandPrestigeScore = finalBrandAdjustment.brandPrestigeScore;
    investmentScore = final;

    valuation = adjustEstimatedValue({
      rawEstimatedValueUsd: enrichedMarketData.estimatedValueUsd,
      mlEstimatedValueUsd: aiInitialEstimateUsd,
      mlPredictionConfidence: mapAdvisorConfidence(openaiInsights.confidence),
      mlPronounceabilityScore: mlPrediction?.extractedFeatures.pronounceabilityScore ?? null,
      mlCategoryHint: mlPrediction?.extractedFeatures.categoryHint ?? null,
      tld: rule.tld,
      score: final,
      investmentScore,
      brandPrestigeScore,
      marketScore,
      riskLevel: getRiskFromScore(final),
      availabilityStatus: availability,
      resaleStatus: marketplace?.resaleStatus ?? "unknown",
      premiumSignal: enrichedMarketData.premiumSignal,
      comparableSalesCount: comparableSalesSummary.count,
      comparableSalesSummary,
      domainLength: rule.name.replace(/\./g, "").length,
      lowQualitySignal: hasLowQualityMlShape(mlPrediction),
      exceptionalBrandSignal,
    });

    let aiAdjustedEstimatedValueUsd = applyAdvisoryValueAdjustment(
      valuation.adjustedEstimatedValueUsd,
      openaiInsights,
    );
    const verdict = getRealityCheckedVerdict({
      score: final,
      aiInsights: openaiInsights,
      marketData: enrichedMarketData,
      tld: rule.tld,
    });
    aiAdjustedEstimatedValueUsd = capAdvisoryAdjustedValue({
      baseValueUsd: aiAdjustedEstimatedValueUsd,
      verdict,
      score: final,
      tld: rule.tld,
      availabilityStatus: availability,
      comparableSalesCount: comparableSalesSummary.count,
      comparableSalesSummary,
      mlPrediction,
      anchorUsd: valuation.tldMarketAnchorUsd,
      aiInsights: openaiInsights,
      exceptionalBrandSignal,
    });

    const pricingConfidence = getPricingConfidence({
      mlConfidence: mlPrediction?.confidence ?? null,
      comparableSales: comparableSalesSummary,
      score: final,
      availabilityStatus: availability,
    });

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
      comparableSalesCount: comparableSalesSummary.count,
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
      comparableSalesCount: comparableSalesSummary.count,
      averageComparableSimilarity: comparableSalesSummary.averageSimilarity,
      premiumFeelScore: openaiInsights.premiumFeelScore,
      endUserDemandScore: openaiInsights.endUserDemandScore,
      aftermarketStrengthScore: openaiInsights.aftermarketStrengthScore,
      negotiationRiskScore: openaiInsights.negotiationRiskScore,
      categoryHint: mlPrediction?.extractedFeatures.categoryHint ?? null,
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
      estimatedValueUsd: enrichedMarketData.estimatedValueUsd,
      aiInitialEstimateUsd,
      mlPredictedValueUsd: mlPrediction?.predictedValueUsd ?? null,
      mlPredictionConfidence: mlPrediction?.confidence ?? null,
      mlExtractedFeatures: mlPrediction?.extractedFeatures ?? null,
      tldMarketAnchorUsd: valuation.tldMarketAnchorUsd,
      modelAdjustedEstimatedValueUsd: valuation.adjustedEstimatedValueUsd,
      adjustedEstimatedValueUsd: aiAdjustedEstimatedValueUsd,
      liquidityScore: valuation.liquidityScore,
      comparableSalesCount: comparableSalesSummary.count,
      valuationBasis: {
        pricingConfidence,
        comparableSalesUsed: comparableSalesSummary.count,
        comparableMedianUsd: comparableSalesSummary.medianSaleUsd,
        comparableWeightedMedianUsd: comparableSalesSummary.weightedMedianSaleUsd,
        averageComparableSimilarity:
          comparableSalesSummary.averageSimilarity > 0
            ? comparableSalesSummary.averageSimilarity
            : null,
      },
      rdap,
      breakdown: rule.breakdown,
      verdict,
      riskLevel: getRiskFromScore(final),
      reasons: rule.reasons,
      weaknesses: rule.weaknesses,
      marketData: enrichedMarketData,
      comparableSales,
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

    setCachedAnalysis(domain, response);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Unable to analyze domain" }, { status: 500 });
  }
}
