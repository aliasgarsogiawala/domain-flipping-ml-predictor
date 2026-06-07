import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);
const MAX_REASONABLE_ML_USD = 10_000_000;
const ML_TIMEOUT_MS = 15000;

export type MlPredictionResult = {
  predictedValueUsd: number;
  confidence: "Low" | "Medium" | "High";
  extractedFeatures: {
    domain: string;
    tld: string;
    domainLength: number;
    wordCount: number;
    containsNumber: number;
    containsHyphen: number;
    premiumKeywordCount: number;
    estimatedBrandabilityScore: number;
    tldTierScore: number;
    vowelRatio: number;
    uniqueCharRatio: number;
    startsWithPremiumKeyword: number;
    endsWithPremiumKeyword: number;
    exactMatchBias: number;
    pronounceabilityScore: number;
    shortPremiumSignal: number;
    tokenBalanceScore: number;
    repeatedCharPenalty: number;
    categoryHint: string;
  };
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeMlPredictionResult(
  parsed: MlPredictionResult | { error: string },
): MlPredictionResult | null {
  if ("error" in parsed) {
    return null;
  }

  if (!isFiniteNumber(parsed.predictedValueUsd)) {
    return null;
  }

  if (parsed.predictedValueUsd < 0 || parsed.predictedValueUsd > MAX_REASONABLE_ML_USD) {
    return null;
  }

  return parsed;
}

function resolvePythonCommand() {
  return process.env.DOMAIN_ML_PYTHON || path.join(process.cwd(), ".venv", "bin", "python");
}

function resolvePredictScript() {
  return path.join(process.cwd(), "ml", "predict.py");
}

/**
 * Calls the hosted FastAPI model service (ml/server.py) when DOMAIN_ML_URL is set.
 * This is the production path (e.g. a Render web service).
 */
async function predictViaHttp(baseUrl: string, domain: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const parsed = (await response.json()) as MlPredictionResult | { error: string };
    return sanitizeMlPredictionResult(parsed);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Local dev fallback: shells out to the Python script directly. Used when
 * DOMAIN_ML_URL is not configured (no hosted service).
 */
async function predictViaPython(domain: string) {
  const { stdout } = await execFileAsync(resolvePythonCommand(), [resolvePredictScript(), domain], {
    cwd: process.cwd(),
    timeout: ML_TIMEOUT_MS,
    maxBuffer: 1024 * 1024,
  });

  const parsed = JSON.parse(stdout) as MlPredictionResult | { error: string };
  return sanitizeMlPredictionResult(parsed);
}

export async function predictDomainValueWithMl(
  domain: string,
): Promise<MlPredictionResult | null> {
  const serviceUrl = process.env.DOMAIN_ML_URL?.trim();

  try {
    return serviceUrl ? await predictViaHttp(serviceUrl, domain) : await predictViaPython(domain);
  } catch {
    return null;
  }
}
