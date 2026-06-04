import OpenAI from "openai";
import { loadMarketData } from "./marketData";

export type DomainIdeaBrief = {
  budgetUsd: number | null;
  niche: string;
  keywords: string[];
  preferredTlds: string[];
  brandStyle: string;
  riskTolerance: "Low" | "Medium" | "High";
  notes?: string;
};

export type DomainIdeaSuggestion = {
  domain: string;
  rationale: string;
  buyerAngle: string;
  riskNote: string;
  scoreHint: number;
  indicativeValueUsd: number;
};

export type DomainIdeaResponse = {
  provider: "openai" | "fallback";
  model: string | null;
  overview: string;
  marketNote: string;
  suggestions: DomainIdeaSuggestion[];
};

export type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatResponse = {
  provider: "openai" | "fallback";
  model: string | null;
  response: string;
  finalVerdict: string;
  reasoning: string[];
  suggestedActions: string[];
  alternativeDomains: string[];
};

export type AssistantAnalysisContext = {
  domain: string;
  score: number;
  adjustedEstimatedValueUsd: number;
  riskLevel: "Low" | "Medium" | "High";
  verdict: string;
  availabilityStatus: "Available" | "Taken" | "Unknown";
  resaleStatus?: string | null;
  reasons: string[];
  weaknesses: string[];
  tld: string;
  liquidityScore?: number;
};

const DEFAULT_MODEL = process.env.OPENAI_DOMAIN_MODEL || "gpt-4.1-mini";
let cachedClient: OpenAI | null = null;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDomain(value: string) {
  const normalized = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(normalized)) return null;
  return normalized;
}

function tokenizeKeywords(keywords: string[]) {
  return keywords
    .flatMap((keyword) => keyword.split(/[\s,]+/))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

async function buildMarketContext() {
  const market = await loadMarketData();
  return {
    totalSalesRecords: market.summary.totalSalesRecords,
    medianSalePrice: market.summary.medianSalePrice,
    mostActiveTld: market.summary.mostActiveTld,
    bestPerformingTldByMedianPrice: market.summary.bestPerformingTldByMedianPrice,
    topTlds: market.tldPerformance.slice(0, 5).map((row) => ({
      tld: row.tld,
      medianSalePrice: row.medianSalePrice,
      saleCount: row.saleCount,
    })),
    topCategories: market.categoryBreakdown.slice(0, 5),
  };
}

function fallbackGenerateIdeas(brief: DomainIdeaBrief): DomainIdeaResponse {
  const keywords = tokenizeKeywords(brief.keywords.length ? brief.keywords : [brief.niche]);
  const stems = keywords.length ? keywords.slice(0, 3) : ["signal", "domain"];
  const tlds = brief.preferredTlds.length ? brief.preferredTlds : [".com", ".ai", ".io"];
  const styleModifiers =
    brief.brandStyle === "Premium"
      ? ["prime", "north", "true", "core", "vault"]
      : brief.brandStyle === "Exact Match"
        ? ["get", "try", "go", "smart"]
        : ["forge", "stack", "mint", "grid", "labs"];

  const suggestions: DomainIdeaSuggestion[] = [];

  for (const tld of tlds) {
    for (const stem of stems) {
      for (const modifier of styleModifiers) {
        const name = brief.brandStyle === "Exact Match" ? `${stem}${modifier}` : `${modifier}${stem}`;
        const domain = normalizeDomain(`${name.replace(/[^a-z0-9-]/g, "")}${tld}`.replace(/\.\./g, "."));
        if (!domain) continue;
        suggestions.push({
          domain,
          rationale: `Built around ${stem} with a ${brief.brandStyle.toLowerCase()} naming pattern and ${tld} extension preference.`,
          buyerAngle:
            tld === ".com"
              ? "Broad commercial buyer that values trust and resale liquidity."
              : "Startup-oriented buyer comfortable with modern extension positioning.",
          riskNote:
            brief.riskTolerance === "Low"
              ? "Keep acquisition spend disciplined and prioritize clean brevity."
              : "Higher-upside positioning may depend on stronger end-user demand.",
          scoreHint: clamp(
            58 +
              (tld === ".com" ? 12 : tld === ".ai" ? 10 : 6) +
              (brief.brandStyle === "Premium" ? 8 : 4),
            45,
            88,
          ),
          indicativeValueUsd:
            tld === ".com"
              ? 2400
              : tld === ".ai"
                ? 1800
                : 1100,
        });
        if (suggestions.length >= 8) break;
      }
      if (suggestions.length >= 8) break;
    }
    if (suggestions.length >= 8) break;
  }

  return {
    provider: "fallback",
    model: null,
    overview: `Generated ${suggestions.length} domain ideas from your keyword, budget, and TLD preferences using the local suggestion engine.`,
    marketNote:
      "This suggestion set is grounded in local market benchmarks and naming heuristics. AI enhancement will improve nuance when an API key is available.",
    suggestions: suggestions.slice(0, 6),
  };
}

function fallbackChatResponse(
  message: string,
  analysisContext?: AssistantAnalysisContext | null,
): AssistantChatResponse {
  const baseName = analysisContext?.domain.split(".")[0] ?? "";
  const focusDomain = analysisContext?.domain;
  const alternativeDomains = focusDomain
    ? [
        `get${baseName}.${analysisContext.tld}`,
        `${baseName}hq.com`,
        `${baseName}labs.ai`,
      ]
        .map(normalizeDomain)
        .filter((item): item is string => Boolean(item))
        .slice(0, 3)
    : [];

  const response = analysisContext
    ? `${analysisContext.domain} currently scores ${analysisContext.score}/100 with ${analysisContext.riskLevel.toLowerCase()} risk and an adjusted estimate around $${analysisContext.adjustedEstimatedValueUsd.toLocaleString()}. The grounded assistant would lean ${analysisContext.score >= 75 ? "toward selective buying" : analysisContext.score >= 58 ? "toward monitoring" : "against active pursuit"} unless the acquisition price is unusually favorable.`
    : `I can help analyze whether a domain is worth buying, propose alternatives, and frame acquisition strategy from your budget and keyword constraints. Ask about a specific name or give me a niche and TLD preference.`;

  return {
    provider: "fallback",
    model: null,
    response,
    finalVerdict: analysisContext
      ? analysisContext.score >= 75
        ? "Worth considering if the entry price stays rational."
        : analysisContext.score >= 58
          ? "Monitor rather than buy immediately."
          : "Capital is probably better deployed elsewhere."
      : "Provide a specific domain or sourcing brief for a sharper verdict.",
    reasoning: analysisContext
      ? [
          `Current score: ${analysisContext.score}/100.`,
          `Availability: ${analysisContext.availabilityStatus}.`,
          analysisContext.weaknesses[0] ?? "Use acquisition price discipline to manage risk.",
        ]
      : [
          "A domain-specific verdict is strongest when grounded in the analyzer output.",
          "Budget, TLD preference, and keyword intent all change the answer materially.",
        ],
    suggestedActions: analysisContext
      ? [
          "Compare the asking price against the adjusted estimate, not just the raw appraisal signal.",
          "Review similar .com, .ai, or .io variants before committing.",
          analysisContext.availabilityStatus === "Taken"
            ? "Add it to the watchlist if you are not ready to negotiate now."
            : "Run a direct analysis and check registration cost before acting.",
        ]
      : [
          "Ask about a specific domain.",
          "Share your budget, keywords, and target TLDs for name suggestions.",
        ],
    alternativeDomains,
  };
}

const ideaSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overview: { type: "string" },
    marketNote: { type: "string" },
    suggestions: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          domain: { type: "string" },
          rationale: { type: "string" },
          buyerAngle: { type: "string" },
          riskNote: { type: "string" },
          scoreHint: { type: "integer", minimum: 35, maximum: 95 },
          indicativeValueUsd: { type: "integer", minimum: 100, maximum: 50000 },
        },
        required: ["domain", "rationale", "buyerAngle", "riskNote", "scoreHint", "indicativeValueUsd"],
      },
    },
  },
  required: ["overview", "marketNote", "suggestions"],
} as const;

const chatSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    response: { type: "string" },
    finalVerdict: { type: "string" },
    reasoning: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    suggestedActions: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    alternativeDomains: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 5,
    },
  },
  required: ["response", "finalVerdict", "reasoning", "suggestedActions", "alternativeDomains"],
} as const;

export async function generateAssistantIdeas(brief: DomainIdeaBrief): Promise<DomainIdeaResponse> {
  const client = getClient();
  if (!client) return fallbackGenerateIdeas(brief);

  const marketContext = await buildMarketContext();

  try {
    const response = await client.responses.create({
      model: DEFAULT_MODEL,
      instructions:
        "You are a domain sourcing copilot. Suggest plausible domain ideas grounded in the provided budget, keyword intent, and market snapshot. Do not claim availability. Keep value estimates conservative and realistic.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({ brief, marketContext }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "domain_idea_generator",
          strict: true,
          schema: ideaSchema,
        },
        verbosity: "low",
      },
    });

    const parsed = JSON.parse(response.output_text) as DomainIdeaResponse;
    return {
      provider: "openai",
      model: DEFAULT_MODEL,
      overview: parsed.overview,
      marketNote: parsed.marketNote,
      suggestions: (parsed.suggestions ?? [])
        .map((item) => ({
          ...item,
          domain: normalizeDomain(item.domain) ?? item.domain.toLowerCase(),
          scoreHint: clamp(item.scoreHint, 35, 95),
          indicativeValueUsd: clamp(item.indicativeValueUsd, 100, 50000),
        }))
        .slice(0, 6),
    };
  } catch {
    return fallbackGenerateIdeas(brief);
  }
}

export async function generateAssistantChatReply(params: {
  message: string;
  history: AssistantChatMessage[];
  analysisContext?: AssistantAnalysisContext | null;
}): Promise<AssistantChatResponse> {
  const client = getClient();
  if (!client) return fallbackChatResponse(params.message, params.analysisContext);

  const marketContext = await buildMarketContext();

  try {
    const response = await client.responses.create({
      model: DEFAULT_MODEL,
      instructions:
        "You are a domain investing copilot. Stay analytical, grounded, and conservative. Do not promise profit. Use the provided domain analysis context when present. Suggest alternative domains as ideas only, not availability claims.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                message: params.message,
                history: params.history.slice(-8),
                analysisContext: params.analysisContext ?? null,
                marketContext,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "domain_copilot_reply",
          strict: true,
          schema: chatSchema,
        },
        verbosity: "low",
      },
    });

    const parsed = JSON.parse(response.output_text) as AssistantChatResponse;
    return {
      provider: "openai",
      model: DEFAULT_MODEL,
      response: parsed.response,
      finalVerdict: parsed.finalVerdict,
      reasoning: (parsed.reasoning ?? []).slice(0, 4),
      suggestedActions: (parsed.suggestedActions ?? []).slice(0, 4),
      alternativeDomains: (parsed.alternativeDomains ?? [])
        .map(normalizeDomain)
        .filter((item): item is string => Boolean(item))
        .slice(0, 5),
    };
  } catch {
    return fallbackChatResponse(params.message, params.analysisContext);
  }
}
