import { NextResponse } from "next/server";
import {
  generateAssistantChatReply,
  generateAssistantIdeas,
  type AssistantAnalysisContext,
  type AssistantChatMessage,
  type DomainIdeaBrief,
} from "@/lib/domainAssistant";

function sanitizeBrief(input: Record<string, unknown>): DomainIdeaBrief {
  const preferredTlds = Array.isArray(input.preferredTlds)
    ? input.preferredTlds
    : typeof input.preferredTlds === "string"
      ? String(input.preferredTlds)
          .split(",")
          .map((item) => item.trim())
      : [];

  return {
    budgetUsd:
      typeof input.budgetUsd === "number"
        ? input.budgetUsd
        : input.budgetUsd
          ? Number(input.budgetUsd)
          : null,
    niche: String(input.niche ?? "").trim(),
    keywords: Array.isArray(input.keywords)
      ? input.keywords.map((item) => String(item).trim()).filter(Boolean)
      : String(input.keywords ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    preferredTlds: preferredTlds
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .map((item) => (item.startsWith(".") ? item : `.${item}`)),
    brandStyle: String(input.brandStyle ?? "Brandable").trim() || "Brandable",
    riskTolerance:
      input.riskTolerance === "Low" || input.riskTolerance === "High"
        ? input.riskTolerance
        : "Medium",
    notes: String(input.notes ?? "").trim() || undefined,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mode = String(body.mode ?? "chat");

    if (mode === "generate") {
      const brief = sanitizeBrief(body.brief as Record<string, unknown>);

      if (!brief.niche && brief.keywords.length === 0) {
        return NextResponse.json(
          { error: "Add a niche or at least one keyword to generate domain ideas." },
          { status: 400 },
        );
      }

      const result = await generateAssistantIdeas(brief);
      return NextResponse.json(result);
    }

    const message = String(body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const history = Array.isArray(body.history)
      ? (body.history as AssistantChatMessage[]).map((item) => ({
          role: (item.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
          content: String(item.content ?? "").trim(),
        }))
      : [];

    const analysisContext = (body.analysisContext ?? null) as AssistantAnalysisContext | null;
    const result = await generateAssistantChatReply({
      message,
      history,
      analysisContext,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unable to process assistant request." }, { status: 500 });
  }
}
