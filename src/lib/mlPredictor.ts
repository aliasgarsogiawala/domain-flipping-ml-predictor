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
 * Local dev fallback: shells out to the Python script directly.
 *
 * Node builtins are imported dynamically and the file paths are assembled from
 * runtime segments on purpose, so the bundler never statically traces a path
 * into the local `.venv` (whose `bin/python` is a symlink outside the project).
 */
async function predictViaPython(domain: string) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const nodePath = await import("node:path");
  const run = promisify(execFile);

  const root = /* turbopackIgnore: true */ process.cwd();
  const pythonSegments = [".venv", "bin", "python"];
  const pythonCommand =
    process.env.DOMAIN_ML_PYTHON || nodePath.join(/* turbopackIgnore: true */ root, ...pythonSegments);
  const scriptPath = nodePath.join(/* turbopackIgnore: true */ root, ...["ml", "predict.py"]);

  const { stdout } = await run(pythonCommand, [scriptPath, domain], {
    cwd: root,
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
