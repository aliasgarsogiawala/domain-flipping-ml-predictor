import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

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
  };
};

function resolvePythonCommand() {
  return process.env.DOMAIN_ML_PYTHON || path.join(process.cwd(), ".venv", "bin", "python");
}

function resolvePredictScript() {
  return path.join(process.cwd(), "ml", "predict.py");
}

export async function predictDomainValueWithMl(
  domain: string,
): Promise<MlPredictionResult | null> {
  try {
    const { stdout } = await execFileAsync(resolvePythonCommand(), [resolvePredictScript(), domain], {
      cwd: process.cwd(),
      timeout: 15000,
      maxBuffer: 1024 * 1024,
    });

    const parsed = JSON.parse(stdout) as MlPredictionResult | { error: string };
    if ("error" in parsed) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
