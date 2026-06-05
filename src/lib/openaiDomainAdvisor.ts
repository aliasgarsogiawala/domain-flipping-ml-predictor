import OpenAI from "openai";
import type { InvestmentRecommendation } from "./investmentReport";

export type OpenAIAdvisoryConfidence = "Low" | "Medium" | "High";

export type OpenAIDomainInsights = {
  provider: "openai" | "fallback";
  model: string | null;
  summary: string;
  valuationRationale: string;
  decisionGuidance: string;
  similarDomains: string[];
  acquisitionSuggestions: string[];
  riskFlags: string[];
  buyerAngles: string[];
  confidence: OpenAIAdvisoryConfidence;
  suggestedRecommendation: InvestmentRecommendation;
  valueAdjustmentPercent: number;
  premiumFeelScore: number;
  eliteWordSignal: boolean;
  endUserDemandScore: number;
  aftermarketStrengthScore: number;
  negotiationRiskScore: number;
};

export type OpenAIDomainAdvisorInput = {
  domain: string;
  name: string;
  tld: string;
  score: number;
  ruleScore: number;
  marketScore: number;
  investmentScore: number;
  brandPrestigeScore: number;
  riskLevel: "Low" | "Medium" | "High";
  availabilityStatus: "Available" | "Taken" | "Unknown";
  resaleStatus: string;
  adjustedEstimatedValueUsd: number;
  tldMarketAnchorUsd: number;
  liquidityScore: number;
  registrar?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  reasons: string[];
  weaknesses: string[];
  comparableSalesCount: number;
};

const DEFAULT_MODEL = process.env.OPENAI_DOMAIN_MODEL || "gpt-4.1-mini";

let cachedClient: OpenAI | null = null;

const advisorySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    valuationRationale: { type: "string" },
    decisionGuidance: { type: "string" },
    similarDomains: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6,
    },
    acquisitionSuggestions: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 5,
    },
    riskFlags: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 5,
    },
    buyerAngles: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    confidence: {
      type: "string",
      enum: ["Low", "Medium", "High"],
    },
    suggestedRecommendation: {
      type: "string",
      enum: ["Buy", "Watch", "Avoid"],
    },
    valueAdjustmentPercent: {
      type: "integer",
      minimum: -12,
      maximum: 12,
    },
    premiumFeelScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    eliteWordSignal: {
      type: "boolean",
    },
    endUserDemandScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    aftermarketStrengthScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    negotiationRiskScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
  },
  required: [
    "summary",
    "valuationRationale",
    "decisionGuidance",
    "similarDomains",
    "acquisitionSuggestions",
    "riskFlags",
    "buyerAngles",
    "confidence",
    "suggestedRecommendation",
    "valueAdjustmentPercent",
    "premiumFeelScore",
    "eliteWordSignal",
    "endUserDemandScore",
    "aftermarketStrengthScore",
    "negotiationRiskScore",
  ],
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

function ensureDomainCandidate(value: string) {
  const normalized = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(normalized)) return null;
  return normalized;
}

function fallbackSimilarDomains(input: OpenAIDomainAdvisorInput) {
  const base = input.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const preferredTlds = [input.tld, "com", "ai", "io", "co", "app"];
  const modifiers = ["get", "go", "try", "hq", "labs", "base", "stack", "works"];
  const suggestions: string[] = [];

  for (const tld of preferredTlds) {
    if (base && suggestions.length < 2) {
      suggestions.push(`${base}.${tld}`);
    }
  }

  for (const modifier of modifiers) {
    if (!base) continue;
    suggestions.push(`${modifier}${base}.${input.tld}`);
    suggestions.push(`${base}${modifier}.${input.tld}`);
    if (suggestions.length >= 8) break;
  }

  return [...new Set(suggestions)]
    .map(ensureDomainCandidate)
    .filter((candidate): candidate is string => Boolean(candidate) && candidate !== input.domain)
    .slice(0, 5);
}

function buildFallbackInsights(input: OpenAIDomainAdvisorInput): OpenAIDomainInsights {
  const recommendation: InvestmentRecommendation =
    input.score >= 80 && input.riskLevel !== "High" && input.availabilityStatus !== "Taken"
      ? "Buy"
      : input.score >= 60
        ? "Watch"
        : "Avoid";

  const valueAdjustmentPercent =
    input.score >= 85 && input.brandPrestigeScore >= 75
      ? 4
      : input.score <= 55 || input.riskLevel === "High"
        ? -4
        : 0;

  return {
    provider: "fallback",
    model: null,
    summary: `${input.domain} shows a ${input.score}/100 signal blend with ${input.riskLevel.toLowerCase()} risk. The AI advisory layer is unavailable, so this summary is grounded in the current scoring engine and market inputs.`,
    valuationRationale:
      valueAdjustmentPercent > 0
        ? "The domain has above-average brand and market signals, so a small upward adjustment is reasonable."
        : valueAdjustmentPercent < 0
          ? "The domain has enough risk or weakness signals that the value estimate should stay conservative."
          : "The current estimate already sits in a reasonable range relative to the scoring and TLD benchmark.",
    decisionGuidance:
      recommendation === "Buy"
        ? "If acquisition cost is disciplined, this is a reasonable candidate to pursue now."
        : recommendation === "Watch"
          ? "Monitor the name and only act if pricing, availability, or market confirmation improves."
          : "Preserve capital for stronger domains with cleaner signal alignment.",
    similarDomains: fallbackSimilarDomains(input),
    acquisitionSuggestions: [
      "Compare the asking price or registration cost against the adjusted estimate instead of the raw appraisal signal.",
      "Check alternate TLD versions and close brand variants before committing budget.",
      "Use the watchlist if ownership or pricing is uncertain.",
    ].slice(0, 3),
    riskFlags: [
      `Availability status is ${input.availabilityStatus.toLowerCase()}.`,
      `${input.weaknesses[0] ?? "Confidence is limited to the current deterministic analysis inputs."}`,
    ],
    buyerAngles: [
      input.tld === "com"
        ? "Broad commercial buyer looking for mainstream trust and flexibility."
        : "Startup or product buyer comfortable with modern TLD positioning.",
      input.name.length <= 10
        ? "Shorter brand-oriented buyer focused on memorability."
        : "Buyer prioritizing fit over absolute brevity.",
    ],
    confidence: "Low",
    suggestedRecommendation: recommendation,
    valueAdjustmentPercent,
    premiumFeelScore:
      input.score >= 80 && input.name.length <= 8 && input.tld === "com"
        ? 72
        : input.score >= 65
          ? 54
          : 24,
    eliteWordSignal:
      input.tld === "com" &&
      !input.name.includes("-") &&
      !/\d/.test(input.name) &&
      input.name.length <= 7 &&
      input.score >= 82,
    endUserDemandScore: clamp(
      Math.round(input.score * 0.55 + (input.comparableSalesCount ?? 0) * 8 + (input.tld === "com" ? 12 : 0)),
      0,
      100,
    ),
    aftermarketStrengthScore: clamp(
      Math.round((input.comparableSalesCount ?? 0) * 14 + (input.tld === "com" ? 18 : input.tld === "ai" ? 10 : 0)),
      0,
      100,
    ),
    negotiationRiskScore: clamp(
      input.availabilityStatus === "Taken"
        ? 70
        : input.resaleStatus === "listed_for_sale"
          ? 60
          : input.riskLevel === "High"
            ? 68
            : 32,
      0,
      100,
    ),
  };
}

function normalizeInsightPayload(
  input: OpenAIDomainAdvisorInput,
  payload: Partial<OpenAIDomainInsights>,
): OpenAIDomainInsights {
  const fallback = buildFallbackInsights(input);
  const similarDomains = [
    ...(payload.similarDomains ?? []),
    ...fallback.similarDomains,
  ]
    .map(ensureDomainCandidate)
    .filter((candidate): candidate is string => Boolean(candidate) && candidate !== input.domain);

  return {
    provider: "openai",
    model: DEFAULT_MODEL,
    summary: payload.summary?.trim() || fallback.summary,
    valuationRationale: payload.valuationRationale?.trim() || fallback.valuationRationale,
    decisionGuidance: payload.decisionGuidance?.trim() || fallback.decisionGuidance,
    similarDomains: [...new Set(similarDomains)].slice(0, 5),
    acquisitionSuggestions:
      payload.acquisitionSuggestions?.map((item) => item.trim()).filter(Boolean).slice(0, 4) ||
      fallback.acquisitionSuggestions,
    riskFlags:
      payload.riskFlags?.map((item) => item.trim()).filter(Boolean).slice(0, 4) ||
      fallback.riskFlags,
    buyerAngles:
      payload.buyerAngles?.map((item) => item.trim()).filter(Boolean).slice(0, 3) ||
      fallback.buyerAngles,
    confidence:
      payload.confidence === "High" || payload.confidence === "Medium" || payload.confidence === "Low"
        ? payload.confidence
        : fallback.confidence,
    suggestedRecommendation:
      payload.suggestedRecommendation === "Buy" ||
      payload.suggestedRecommendation === "Watch" ||
      payload.suggestedRecommendation === "Avoid"
        ? payload.suggestedRecommendation
        : fallback.suggestedRecommendation,
    valueAdjustmentPercent: clamp(
      typeof payload.valueAdjustmentPercent === "number" ? Math.round(payload.valueAdjustmentPercent) : 0,
      -12,
      12,
    ),
    premiumFeelScore: clamp(
      typeof payload.premiumFeelScore === "number" ? Math.round(payload.premiumFeelScore) : fallback.premiumFeelScore,
      0,
      100,
    ),
    eliteWordSignal:
      typeof payload.eliteWordSignal === "boolean" ? payload.eliteWordSignal : fallback.eliteWordSignal,
    endUserDemandScore: clamp(
      typeof payload.endUserDemandScore === "number" ? Math.round(payload.endUserDemandScore) : fallback.endUserDemandScore,
      0,
      100,
    ),
    aftermarketStrengthScore: clamp(
      typeof payload.aftermarketStrengthScore === "number"
        ? Math.round(payload.aftermarketStrengthScore)
        : fallback.aftermarketStrengthScore,
      0,
      100,
    ),
    negotiationRiskScore: clamp(
      typeof payload.negotiationRiskScore === "number"
        ? Math.round(payload.negotiationRiskScore)
        : fallback.negotiationRiskScore,
      0,
      100,
    ),
  };
}

export function applyAdvisoryValueAdjustment(
  baseValue: number,
  advisory: Pick<OpenAIDomainInsights, "confidence" | "valueAdjustmentPercent">,
) {
  const confidenceCap =
    advisory.confidence === "High" ? 0.08 : advisory.confidence === "Medium" ? 0.05 : 0.03;
  const normalizedPercent = clamp(advisory.valueAdjustmentPercent / 100, -confidenceCap, confidenceCap);
  return Math.max(0, Math.round(baseValue * (1 + normalizedPercent)));
}

export async function generateOpenAIDomainInsights(
  input: OpenAIDomainAdvisorInput,
): Promise<OpenAIDomainInsights> {
  const client = getClient();

  if (!client) {
    return buildFallbackInsights(input);
  }

  try {
    const response = await client.responses.create({
      model: DEFAULT_MODEL,
      instructions:
        "You are an analyst inside a domain investing platform. Stay analytical and conservative. Do not promise profits. Use only modest valuation adjustments. Similar domain suggestions should be brand-adjacent and plausible domain strings, not claims of availability. Be strict about premium ratings: only truly elite, broad-demand domains should score highly on premium feel or elite-word signal.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(input),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "domainflip_ai_advisory",
          strict: true,
          schema: advisorySchema,
        },
        verbosity: "low",
      },
    });

    const raw = JSON.parse(response.output_text) as Partial<OpenAIDomainInsights>;
    return normalizeInsightPayload(input, raw);
  } catch {
    return buildFallbackInsights(input);
  }
}
