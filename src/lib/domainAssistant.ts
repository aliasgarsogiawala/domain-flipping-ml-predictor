import { GoogleGenAI } from "@google/genai";
import { formatInrFromUsd } from "./currency";
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
  provider: "gemini" | "fallback";
  model: string | null;
  overview: string;
  marketNote: string;
  suggestions: DomainIdeaSuggestion[];
  diagnostics?: {
    attemptedProviders: string[];
    warning?: string | null;
  };
};

export type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatResponse = {
  provider: "gemini" | "fallback";
  model: string | null;
  response: string;
  finalVerdict: string;
  reasoning: string[];
  suggestedActions: string[];
  alternativeDomains: string[];
  independentPerspective?: {
    provider: "gemini";
    model: string | null;
    response: string;
    finalVerdict: string;
    reasoning: string[];
    alternativeDomains: string[];
    searchGrounded: boolean;
    citedSources: string[];
  } | null;
};

export type MarketAssistantResponse = {
  provider: "gemini" | "fallback";
  model: string | null;
  answer: string;
  insights: string[];
  suggestedFilters: string[];
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

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_DOMAIN_MODEL || "gemini-2.0-flash";
let cachedGeminiClient: GoogleGenAI | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || null;
}

function getGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  if (!cachedGeminiClient) {
    cachedGeminiClient = new GoogleGenAI({ apiKey });
  }
  return cachedGeminiClient;
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

function fallbackMarketResponse(
  marketContext: Awaited<ReturnType<typeof buildMarketContext>>,
): MarketAssistantResponse {
  return {
    provider: "fallback",
    model: null,
    answer: `The local market dataset points first toward ${marketContext.bestPerformingTldByMedianPrice} for pricing strength and ${marketContext.mostActiveTld} for broader liquidity. For sourcing, tighter screens around one TLD and one budget band usually reveal better patterns than a broad market sweep.`,
    insights: [
      `Dataset median sale price is ${formatInrFromUsd(marketContext.medianSalePrice)}.`,
      `${marketContext.bestPerformingTldByMedianPrice} is the strongest median-price extension in the current dataset snapshot.`,
      `${marketContext.mostActiveTld} carries the deepest observed sales count right now.`,
    ],
    suggestedFilters: [
      `${marketContext.bestPerformingTldByMedianPrice} + $1k-$5k`,
      `${marketContext.mostActiveTld} + startup`,
      `All TLDs + under $5k`,
    ],
  };
}

function fallbackGenerateIdeas(brief: DomainIdeaBrief): DomainIdeaResponse {
  const keywords = tokenizeKeywords(brief.keywords.length ? brief.keywords : [brief.niche]);
  const stems = keywords.length ? keywords.slice(0, 3) : ["signal", "domain"];
  const tlds = brief.preferredTlds.length ? brief.preferredTlds : [".com", ".ai", ".io"];
  const styleParts =
    brief.brandStyle === "Premium"
      ? ["prime", "north", "true", "core", "vault"]
      : brief.brandStyle === "Exact Match"
        ? ["get", "try", "go", "smart"]
        : ["forge", "stack", "mint", "grid", "labs"];

  const suggestions: DomainIdeaSuggestion[] = [];

  for (const tld of tlds) {
    for (const stem of stems) {
      for (const part of styleParts) {
        const name = brief.brandStyle === "Exact Match" ? `${stem}${part}` : `${part}${stem}`;
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
    overview: `Generated ${suggestions.length} starter names from your budget, keyword, and TLD preferences using the built-in fallback engine.`,
    marketNote:
      "These ideas come from the local naming heuristic layer, using market anchors and basic domain-quality rules. They are useful as placeholders, but not as strong as live model output.",
    suggestions: suggestions.slice(0, 6),
    diagnostics: {
      attemptedProviders: ["fallback"],
      warning: "No external AI provider was used for this result.",
    },
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
    ? `${analysisContext.domain} currently scores ${analysisContext.score}/100 with ${analysisContext.riskLevel.toLowerCase()} risk and an adjusted estimate around ${formatInrFromUsd(analysisContext.adjustedEstimatedValueUsd)}. The grounded assistant would lean ${analysisContext.score >= 75 ? "toward selective buying" : analysisContext.score >= 58 ? "toward monitoring" : "against active pursuit"} unless the acquisition price is unusually favorable.`
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
    independentPerspective: null,
  };
}

async function generateGeminiJson<T>({
  prompt,
  schema,
  searchGrounded = false,
}: {
  prompt: string;
  schema: Record<string, unknown>;
  searchGrounded?: boolean;
}) {
  const client = getGeminiClient();
  if (!client) return null;

  const response = await client.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: prompt,
    config: {
      ...(searchGrounded ? { tools: [{ googleSearch: {} }] } : {}),
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const citedSources = [
    ...new Set(
      (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [])
        .map((chunk) => chunk.web?.uri?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].slice(0, 6);

  return {
    parsed: JSON.parse(text) as T,
    citedSources,
    searchGrounded: citedSources.length > 0,
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

const groundedChatSchema = {
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
    alternativeDomains: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 5,
    },
  },
  required: ["response", "finalVerdict", "reasoning", "alternativeDomains"],
} as const;

export async function generateAssistantIdeas(brief: DomainIdeaBrief): Promise<DomainIdeaResponse> {
  const marketContext = await buildMarketContext();
  const geminiPrompt = [
    "You are a premium domain naming strategist.",
    "Generate original, plausible, investor-aware domain ideas.",
    "Do not simply prepend or append canned prefixes or suffixes to the provided keywords.",
    "Avoid low-effort patterns like keyword + labs, keyword + hq, get + keyword, or keyword + ai unless the result is unusually strong.",
    "At least half of the suggestions should NOT contain the main keyword verbatim.",
    "Use naming techniques like metaphor, compression, phonetic branding, adjacent concepts, semantic association, or invented but pronounceable brandables.",
    "Create names that feel like real startup, software, or brand assets that a founder would actually shortlist.",
    "Return a varied set: some brandable names, some commercially direct names, and some premium-feeling concise names.",
    "Respect budget, risk tolerance, TLD preference, and style.",
    "Do not claim availability.",
    "Keep pricing hints conservative and believable.",
    JSON.stringify({ brief, marketContext }),
  ].join("\n\n");

  try {
    const geminiResult = await generateGeminiJson<DomainIdeaResponse>({
      prompt: geminiPrompt,
      schema: ideaSchema as unknown as Record<string, unknown>,
    });

    if (geminiResult) {
      return {
        provider: "gemini",
        model: DEFAULT_GEMINI_MODEL,
        overview: geminiResult.parsed.overview,
        marketNote: geminiResult.parsed.marketNote,
        suggestions: (geminiResult.parsed.suggestions ?? [])
          .map((item) => ({
            ...item,
            domain: normalizeDomain(item.domain) ?? item.domain.toLowerCase(),
            scoreHint: clamp(item.scoreHint, 35, 95),
            indicativeValueUsd: clamp(item.indicativeValueUsd, 100, 50000),
          }))
          .slice(0, 6),
        diagnostics: {
          attemptedProviders: ["gemini"],
          warning: null,
        },
      };
    }
  } catch (error) {
    const geminiFailure = error instanceof Error ? error.message : "Gemini generation failed.";
    const fallback = fallbackGenerateIdeas(brief);
    return {
      ...fallback,
      diagnostics: {
        attemptedProviders: ["gemini", "fallback"],
        warning: `Gemini failed, fallback logic used. ${geminiFailure}`,
      },
    };
  }

  const fallback = fallbackGenerateIdeas(brief);
  return {
    ...fallback,
    diagnostics: {
      attemptedProviders: ["gemini", "fallback"],
      warning: "Gemini was unavailable, fallback logic used.",
    },
  };
}

export async function generateAssistantChatReply(params: {
  message: string;
  history: AssistantChatMessage[];
  analysisContext?: AssistantAnalysisContext | null;
}): Promise<AssistantChatResponse> {
  const marketContext = await buildMarketContext();

  try {
    const geminiResult = await generateGeminiJson<{
      response: string;
      finalVerdict: string;
      reasoning: string[];
      suggestedActions: string[];
      alternativeDomains: string[];
    }>({
      prompt: [
        "You are a domain investing copilot. Stay analytical, grounded, and conservative. Do not promise profit. Use the provided domain analysis context when present. Suggest alternative domains as ideas only, not availability claims. Use Google Search grounding when useful.",
        JSON.stringify({
          message: params.message,
          history: params.history.slice(-8),
          analysisContext: params.analysisContext ?? null,
          marketContext,
        }),
      ].join("\n\n"),
      schema: chatSchema as unknown as Record<string, unknown>,
      searchGrounded: true,
    });

    if (geminiResult) {
      const parsed = geminiResult.parsed;
      return {
        provider: "gemini",
        model: DEFAULT_GEMINI_MODEL,
        response: parsed.response,
        finalVerdict: parsed.finalVerdict,
        reasoning: (parsed.reasoning ?? []).slice(0, 4),
        suggestedActions: (parsed.suggestedActions ?? []).slice(0, 4),
        alternativeDomains: (parsed.alternativeDomains ?? [])
          .map(normalizeDomain)
          .filter((item): item is string => Boolean(item))
          .slice(0, 5),
        independentPerspective: geminiResult.citedSources.length > 0
          ? {
              provider: "gemini",
              model: DEFAULT_GEMINI_MODEL,
              response: parsed.response,
              finalVerdict: parsed.finalVerdict,
              reasoning: (parsed.reasoning ?? []).slice(0, 4),
              alternativeDomains: (parsed.alternativeDomains ?? [])
                .map(normalizeDomain)
                .filter((item): item is string => Boolean(item))
                .slice(0, 5),
              searchGrounded: geminiResult.searchGrounded,
              citedSources: geminiResult.citedSources,
            }
          : null,
      };
    }
  } catch {
    // Fall through to fallback.
  }

  return fallbackChatResponse(params.message, params.analysisContext);
}

export async function generateMarketAssistantReply(question: string): Promise<MarketAssistantResponse> {
  const marketContext = await buildMarketContext();

  try {
    const geminiResult = await generateGeminiJson<{
      answer: string;
      insights: string[];
      suggestedFilters: string[];
    }>({
      prompt: [
        "You are a domain market research assistant.",
        "Answer using only the supplied local market dataset context.",
        "Do not claim live or real-time external data.",
        JSON.stringify({ question, marketContext }),
      ].join("\n\n"),
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          answer: { type: "string" },
          insights: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
          suggestedFilters: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
        },
        required: ["answer", "insights", "suggestedFilters"],
      },
    });

    if (geminiResult) {
      return {
        provider: "gemini",
        model: DEFAULT_GEMINI_MODEL,
        answer: geminiResult.parsed.answer,
        insights: geminiResult.parsed.insights.slice(0, 4),
        suggestedFilters: geminiResult.parsed.suggestedFilters.slice(0, 4),
      };
    }
  } catch {
    // Fall through.
  }

  return fallbackMarketResponse(marketContext);
}
