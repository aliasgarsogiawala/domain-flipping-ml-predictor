import { NextResponse } from "next/server";
import {
  analyzeRuleDomain,
  getRiskFromScore,
  getVerdictFromScore,
  scoreRegistrationHistory,
  STRONG_TLDS_MAP,
} from "@/lib/domainAnalyzer";
import { getMockMarketData, type MockMarketData } from "@/lib/mockMarketData";
import { lookupRDAP } from "@/lib/rdap";
import { getMarketplaceStatus } from "@/lib/domainMarketplace";

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
      rdap,
      breakdown: rule.breakdown,
      verdict: getVerdictFromScore(final),
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
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Unable to analyze domain" }, { status: 500 });
  }
}
