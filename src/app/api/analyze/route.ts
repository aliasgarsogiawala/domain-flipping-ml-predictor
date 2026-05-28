import { NextResponse } from "next/server";
import { analyzeRuleDomain, getVerdictFromScore, getRiskFromScore, STRONG_TLDS_MAP } from "@/lib/domainAnalyzer";
import { getMockMarketData } from "@/lib/mockMarketData";
import { getMockAvailabilityStatus } from "@/lib/domainAvailability";

async function computeMarketScore(marketData: any) {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const domain = (body?.domain ?? "").toString().trim();

    if (!domain) {
      return NextResponse.json({ error: "Missing domain" }, { status: 400 });
    }

    // Run rule-based analysis
    const rule = analyzeRuleDomain(domain);

    // Market data & availability
    const marketData = getMockMarketData(rule.domain);
    const availability = getMockAvailabilityStatus(rule.domain);

    const marketScore = await computeMarketScore(marketData);

    // Combine scores (blend rule and market)
    let final = Math.round((rule.ruleScore * 0.55 + marketScore * 0.45));

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
    const tldStrength = STRONG_TLDS_MAP[tld] ?? 0;
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

    final = Math.max(0, Math.min(100, final));

    const response = {
      domain: rule.domain,
      name: rule.name,
      tld: rule.tld,
      score: final,
      ruleScore: rule.ruleScore,
      marketScore,
      availabilityStatus: availability,
      estimatedValueUsd: marketData.estimatedValueUsd,
      comparableSalesCount: marketData.comparableSalesCount,
      breakdown: rule.breakdown,
      verdict: getVerdictFromScore(final),
      riskLevel: getRiskFromScore(final),
      reasons: rule.reasons,
      weaknesses: rule.weaknesses,
      marketData,
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json({ error: "Unable to analyze domain" }, { status: 500 });
  }
}
