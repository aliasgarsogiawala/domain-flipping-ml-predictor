import { promises as fs } from "node:fs";
import path from "node:path";

export type MarketSaleRecord = {
  domain: string;
  salePriceUsd: number;
  saleDate: string | null;
  saleDateTimestamp: number | null;
  venue: string;
  tld: string;
  category: string;
  wordCount: number | null;
  charLength: number | null;
  sourceFile: string;
};

export type MarketSummary = {
  totalSalesRecords: number;
  medianSalePrice: number;
  highestReportedSale: MarketSaleRecord | null;
  mostActiveTld: string;
  bestPerformingTldByMedianPrice: string;
};

export type TldPerformanceRow = {
  tld: string;
  medianSalePrice: number;
  averageSalePrice: number;
  saleCount: number;
};

export type CategoryBreakdownRow = {
  category: string;
  salesCount: number;
  medianPrice: number;
};

export type PriceDistributionRow = {
  range: string;
  count: number;
};

export type ComparableSaleMatch = MarketSaleRecord & {
  similarityScore: number;
  matchReasons: string[];
};

export type MarketAnomaly = {
  type: "tld" | "category";
  key: string;
  direction: "hot" | "soft";
  medianPrice: number;
  baselineMedianPrice: number;
  ratio: number;
  note: string;
};

export type MarketDataResult = {
  latestReportedSales: MarketSaleRecord[];
  summary: MarketSummary;
  tldPerformance: TldPerformanceRow[];
  categoryBreakdown: CategoryBreakdownRow[];
  priceDistribution: PriceDistributionRow[];
  anomalies: MarketAnomaly[];
  availableTlds: string[];
  availableCategories: string[];
  dataSource: "processed" | "raw" | "empty";
};

const ROOT = process.cwd();
const MASTER_DATASET_PATH = path.join(ROOT, "data", "processed", "domain_sales_master.csv");
const SNAPSHOT_DATASET_PATH = path.join(ROOT, "data", "processed", "market_snapshot.json");
const RAW_DATA_DIR = path.join(ROOT, "data", "raw");
let marketDataPromise: Promise<MarketDataResult> | null = null;
let marketRecordsPromise: Promise<MarketSaleRecord[]> | null = null;

function parseDelimitedLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseDelimitedText(text: string, delimiter: string) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (rows.length === 0) return [];

  return rows.map((line) => parseDelimitedLine(line, delimiter));
}

function inferTld(domain: string) {
  const normalized = domain.trim().toLowerCase();
  if (!normalized.includes(".")) return ".unknown";
  const parts = normalized.split(".");
  if (parts.length >= 3 && parts.at(-2) === "co") {
    return `.${parts.at(-2)}.${parts.at(-1)}`;
  }
  return `.${parts.at(-1)}`;
}

function inferName(domain: string) {
  const normalized = domain.trim().toLowerCase();
  return normalized.includes(".") ? normalized.slice(0, normalized.lastIndexOf(".")) : normalized;
}

function tokenizeName(name: string) {
  return name.split(/[^a-z0-9]+/).filter(Boolean);
}

function inferWordCount(domain: string) {
  const name = inferName(domain);
  const parts = name.split(/[-_]/).filter(Boolean);
  return parts.length > 0 ? parts.length : 1;
}

function inferCharLength(domain: string) {
  return inferName(domain).replace(/\./g, "").length;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ai: ["ai", "agent", "gpt", "model", "neural", "bot"],
  startup: ["labs", "stack", "flow", "base", "launch", "build", "forge", "mint", "pilot"],
  finance: ["pay", "bank", "fund", "trade", "capital", "invest"],
  crypto: ["crypto", "chain", "coin", "wallet", "block"],
  health: ["health", "care", "med", "clinic", "bio"],
  data: ["data", "cloud", "ops", "sync", "graph", "signal", "compute", "search"],
  commerce: ["shop", "store", "sale", "market", "buy", "cart"],
  travel: ["trip", "travel", "tour", "flight", "hotel"],
  education: ["learn", "school", "edu", "course", "academy"],
  legal: ["law", "legal", "attorney", "firm"],
};

const COMMERCIAL_TERMS = new Set(["pay", "bank", "fund", "trade", "capital", "invest", "market", "shop"]);
const TECH_TERMS = new Set([
  "ai",
  "agent",
  "gpt",
  "model",
  "cloud",
  "data",
  "stack",
  "dev",
  "signal",
  "search",
  "compute",
  "pilot",
  "forge",
]);
const GLOBAL_BRAND_TOKENS = new Set([
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

const CATEGORY_COMPATIBILITY: Record<string, string[]> = {
  brand: ["short"],
  short: ["brand"],
  ai: ["tech", "data", "startup"],
  tech: ["ai", "data", "startup"],
  data: ["ai", "tech", "startup"],
  startup: ["ai", "tech", "data", "brand"],
  finance: ["commerce"],
  commerce: ["finance"],
};

export function inferMarketCategory(domain: string) {
  const name = inferName(domain);
  const tokens = tokenizeName(name);
  const compact = tokens.join("");

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => tokens.includes(keyword) || compact.includes(keyword))) {
      return category;
    }
  }

  if (tokens.some((token: string) => GLOBAL_BRAND_TOKENS.has(token))) {
    return "brand";
  }

  if (tokens.some((token: string) => COMMERCIAL_TERMS.has(token))) {
    return "commerce";
  }

  if (tokens.some((token: string) => TECH_TERMS.has(token))) {
    return "tech";
  }

  if (tokens.length >= 3) {
    return "general";
  }

  if (compact.length <= 4 && /^[a-z]+$/.test(compact)) {
    return "short";
  }

  if (tokens.length === 1 && compact.length >= 5 && compact.length <= 10 && /^[a-z]+$/.test(compact)) {
    return "brand";
  }

  return "general";
}

function normalizeDate(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const timestamp = Date.parse(trimmed);
  if (!Number.isNaN(timestamp)) return { saleDate: trimmed, saleDateTimestamp: timestamp };
  return { saleDate: trimmed, saleDateTimestamp: null };
}

function normalizeNumber(value: string | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function dedupeRecords(records: MarketSaleRecord[]) {
  const seen = new Set<string>();
  const unique: MarketSaleRecord[] = [];

  for (const record of records) {
    const key = `${record.domain}|${record.salePriceUsd}|${record.saleDate ?? ""}|${record.venue}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(record);
  }

  return unique;
}

function computeMedian(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }
  return Math.round(sorted[middle]);
}

function buildRecordFromRow(
  row: Record<string, string>,
  sourceFile: string,
): MarketSaleRecord | null {
  const domain = (row.domain ?? row.Domain ?? "").trim().toLowerCase();
  if (!domain || !domain.includes(".")) return null;

  const salePriceUsd =
    normalizeNumber(row.salePriceUsd) ??
    normalizeNumber(row.priceUsd) ??
    normalizeNumber(row.price);
  if (!salePriceUsd || salePriceUsd <= 0) return null;

  const dateInfo =
    normalizeDate(row.saleDate) ??
    normalizeDate(row.date) ??
    normalizeDate(row.sale_date);

  const rawTld = (row.tld ?? "").trim().toLowerCase();
  const normalizedTld = rawTld
    ? rawTld.startsWith(".")
      ? rawTld
      : `.${rawTld}`
    : inferTld(domain);

  return {
    domain,
    salePriceUsd,
    saleDate: dateInfo?.saleDate ?? null,
    saleDateTimestamp: dateInfo?.saleDateTimestamp ?? null,
    venue: (row.venue ?? "Unknown").trim() || "Unknown",
    tld: normalizedTld,
    category: (row.category ?? "general").trim().toLowerCase() || "general",
    wordCount: normalizeNumber(row.wordCount) ?? inferWordCount(domain),
    charLength: normalizeNumber(row.charLength) ?? inferCharLength(domain),
    sourceFile,
  };
}

async function loadRowsFromFile(filePath: string) {
  const fileName = path.basename(filePath);
  if (fileName === ".DS_Store" || fileName.includes("expired_domains") || fileName.includes("domainSales_combined_seed")) {
    return [] as MarketSaleRecord[];
  }

  const delimiter = filePath.endsWith(".tsv") ? "\t" : ",";
  const content = await fs.readFile(filePath, "utf8");
  const rows = parseDelimitedText(content, delimiter);
  if (rows.length < 2) return [] as MarketSaleRecord[];

  const header = rows[0];
  const normalizedHeader = header.map((column) => column.trim());
  if (!normalizedHeader.some((column) => column.toLowerCase() === "domain")) {
    return [] as MarketSaleRecord[];
  }

  const records: MarketSaleRecord[] = [];
  for (const row of rows.slice(1)) {
    const mapped = Object.fromEntries(normalizedHeader.map((column, index) => [column, row[index] ?? ""]));
    const record = buildRecordFromRow(mapped, fileName);
    if (record) {
      records.push(record);
    }
  }
  return records;
}

async function loadRawRecords() {
  const files = await fs.readdir(RAW_DATA_DIR);
  const allRecords = await Promise.all(
    files
      .filter((file) => file.endsWith(".csv") || file.endsWith(".tsv"))
      .map((file) => loadRowsFromFile(path.join(RAW_DATA_DIR, file))),
  );
  return allRecords.flat();
}

async function loadMasterRecords() {
  const content = await fs.readFile(MASTER_DATASET_PATH, "utf8");
  const rows = parseDelimitedText(content, ",");
  if (rows.length < 2) return [] as MarketSaleRecord[];
  const header = rows[0];
  return rows
    .slice(1)
    .map((row) => Object.fromEntries(header.map((column, index) => [column, row[index] ?? ""])))
    .map((row) => buildRecordFromRow(row, "domain_sales_master.csv"))
    .filter((record): record is MarketSaleRecord => Boolean(record));
}

async function loadSnapshotData() {
  const content = await fs.readFile(SNAPSHOT_DATASET_PATH, "utf8");
  const parsed = JSON.parse(content) as MarketDataResult;

  return {
    latestReportedSales: dedupeRecords(parsed.latestReportedSales ?? []),
    summary: parsed.summary,
    tldPerformance: parsed.tldPerformance ?? [],
    categoryBreakdown: parsed.categoryBreakdown ?? [],
    priceDistribution: parsed.priceDistribution ?? [],
    anomalies: parsed.anomalies ?? [],
    availableTlds: parsed.availableTlds ?? [],
    availableCategories: parsed.availableCategories ?? [],
    dataSource: "processed" as const,
  };
}

function buildSummary(records: MarketSaleRecord[]): MarketSummary {
  const prices = records.map((record) => record.salePriceUsd);
  const tldCounts = new Map<string, number>();
  const byTld = new Map<string, number[]>();

  for (const record of records) {
    tldCounts.set(record.tld, (tldCounts.get(record.tld) ?? 0) + 1);
    byTld.set(record.tld, [...(byTld.get(record.tld) ?? []), record.salePriceUsd]);
  }

  const mostActiveTld =
    [...tldCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ".com";

  const bestPerformingTldByMedianPrice =
    [...byTld.entries()]
      .map(([tld, values]) => ({ tld, median: computeMedian(values), count: values.length }))
      .filter((entry) => entry.count >= 5)
      .sort((a, b) => b.median - a.median)[0]?.tld ?? ".com";

  return {
    totalSalesRecords: records.length,
    medianSalePrice: computeMedian(prices),
    highestReportedSale: [...records].sort((a, b) => b.salePriceUsd - a.salePriceUsd)[0] ?? null,
    mostActiveTld,
    bestPerformingTldByMedianPrice,
  };
}

function buildTldPerformance(records: MarketSaleRecord[]) {
  const grouped = new Map<string, number[]>();

  for (const record of records) {
    grouped.set(record.tld, [...(grouped.get(record.tld) ?? []), record.salePriceUsd]);
  }

  return [...grouped.entries()]
    .map(([tld, values]) => ({
      tld,
      medianSalePrice: computeMedian(values),
      averageSalePrice: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      saleCount: values.length,
    }))
    .sort((a, b) => b.saleCount - a.saleCount)
    .slice(0, 12);
}

function buildCategoryBreakdown(records: MarketSaleRecord[]) {
  const grouped = new Map<string, number[]>();

  for (const record of records) {
    grouped.set(record.category, [...(grouped.get(record.category) ?? []), record.salePriceUsd]);
  }

  return [...grouped.entries()]
    .map(([category, values]) => ({
      category,
      salesCount: values.length,
      medianPrice: computeMedian(values),
    }))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 10);
}

function buildPriceDistribution(records: MarketSaleRecord[]): PriceDistributionRow[] {
  const buckets = [
    { range: "$0-$1k", min: 0, max: 1000 },
    { range: "$1k-$5k", min: 1000, max: 5000 },
    { range: "$5k-$10k", min: 5000, max: 10000 },
    { range: "$10k-$50k", min: 10000, max: 50000 },
    { range: "$50k+", min: 50000, max: Number.POSITIVE_INFINITY },
  ];

  return buckets.map((bucket) => ({
    range: bucket.range,
    count: records.filter(
      (record) => record.salePriceUsd >= bucket.min && record.salePriceUsd < bucket.max,
    ).length,
  }));
}

function buildMarketAnomalies(records: MarketSaleRecord[]): MarketAnomaly[] {
  const overallMedian = computeMedian(records.map((record) => record.salePriceUsd));
  const anomalies: MarketAnomaly[] = [];

  const evaluateGroup = (
    type: "tld" | "category",
    key: string,
    groupedRecords: MarketSaleRecord[],
  ) => {
    if (groupedRecords.length < 6) return;

    const medianPrice = computeMedian(groupedRecords.map((record) => record.salePriceUsd));
    const ratio = overallMedian > 0 ? medianPrice / overallMedian : 1;

    if (ratio >= 1.9) {
      anomalies.push({
        type,
        key,
        direction: "hot",
        medianPrice,
        baselineMedianPrice: overallMedian,
        ratio,
        note: `${key} is pricing well above the broader observed median, suggesting stronger-than-average buyer willingness.`,
      });
    } else if (ratio <= 0.45) {
      anomalies.push({
        type,
        key,
        direction: "soft",
        medianPrice,
        baselineMedianPrice: overallMedian,
        ratio,
        note: `${key} is clearing well below the broader observed median, suggesting weaker liquidity or narrower buyer fit.`,
      });
    }
  };

  const byTld = new Map<string, MarketSaleRecord[]>();
  const byCategory = new Map<string, MarketSaleRecord[]>();

  for (const record of records) {
    byTld.set(record.tld, [...(byTld.get(record.tld) ?? []), record]);
    byCategory.set(record.category, [...(byCategory.get(record.category) ?? []), record]);
  }

  for (const [tld, groupedRecords] of byTld.entries()) {
    evaluateGroup("tld", tld, groupedRecords);
  }

  for (const [category, groupedRecords] of byCategory.entries()) {
    evaluateGroup("category", category, groupedRecords);
  }

  return anomalies
    .sort((left, right) => Math.abs(right.ratio - 1) - Math.abs(left.ratio - 1))
    .slice(0, 8);
}

function scoreComparableMatch(params: {
  targetTld: string;
  targetLength: number;
  targetCategory: string;
  targetWordCount: number;
  record: MarketSaleRecord;
}) {
  let score = 0;
  const reasons: string[] = [];
  const recordCategory = params.record.category || "general";
  const compatibleCategories = CATEGORY_COMPATIBILITY[params.targetCategory] ?? [];

  if (params.record.tld === params.targetTld) {
    score += 30;
    reasons.push("Same TLD");
  }

  const lengthGap = Math.abs((params.record.charLength ?? params.targetLength) - params.targetLength);
  if (lengthGap === 0) {
    score += 20;
    reasons.push("Same length");
  } else if (lengthGap <= 2) {
    score += 12;
    reasons.push("Similar length");
  } else if (lengthGap <= 4) {
    score += 4;
  }

  if (recordCategory === params.targetCategory) {
    score += 36;
    reasons.push("Same category");
  } else if (compatibleCategories.includes(recordCategory)) {
    score += 14;
    reasons.push("Related category");
  } else if (params.targetCategory === "general" && recordCategory === "general") {
    score += 8;
  } else if (params.targetCategory !== "general" && recordCategory === "general") {
    score -= 10;
  } else {
    score -= 18;
  }

  const recordWordCount = params.record.wordCount ?? 1;
  if (recordWordCount === params.targetWordCount) {
    score += 8;
    reasons.push("Same word count");
  } else if (Math.abs(recordWordCount - params.targetWordCount) <= 1) {
    score += 3;
  }

  if (recordWordCount === 1 && params.targetWordCount === 1) {
    score += 6;
  }

  return {
    score,
    reasons,
  };
}

async function loadMarketRecordsPool() {
  if (marketRecordsPromise) {
    return marketRecordsPromise;
  }

  marketRecordsPromise = (async () => {
    const hasMasterDataset = await fs
      .access(MASTER_DATASET_PATH)
      .then(() => true)
      .catch(() => false);

    if (hasMasterDataset) {
      return (await loadMasterRecords()).filter((record) => record.salePriceUsd > 0);
    }

    const hasSnapshotDataset = await fs
      .access(SNAPSHOT_DATASET_PATH)
      .then(() => true)
      .catch(() => false);

    if (hasSnapshotDataset) {
      const snapshot = await loadSnapshotData();
      return snapshot.latestReportedSales.filter((record) => record.salePriceUsd > 0);
    }

    return (await loadRawRecords()).filter((record) => record.salePriceUsd > 0);
  })();

  try {
    return await marketRecordsPromise;
  } catch (error) {
    marketRecordsPromise = null;
    throw error;
  }
}

export async function findComparableSales(domain: string, limit = 5): Promise<ComparableSaleMatch[]> {
  const records = await loadMarketRecordsPool();
  if (records.length === 0) return [];

  const normalizedDomain = domain.trim().toLowerCase();
  const targetTld = inferTld(normalizedDomain);
  const targetLength = inferCharLength(normalizedDomain);
  const targetCategory = inferMarketCategory(normalizedDomain);
  const targetWordCount = inferWordCount(normalizedDomain);

  const scored = records
    .filter((record) => record.domain !== normalizedDomain)
    .map((record) => {
      const { score, reasons } = scoreComparableMatch({
        targetTld,
        targetLength,
        targetCategory,
        targetWordCount,
        record,
      });

      return {
        ...record,
        similarityScore: score,
        matchReasons: reasons,
      };
    })
    .filter((record) => record.similarityScore >= 34)
    .sort((left, right) => {
      if (right.similarityScore !== left.similarityScore) {
        return right.similarityScore - left.similarityScore;
      }
      return right.salePriceUsd - left.salePriceUsd;
    });

  // Dedupe by domain so the same sale never appears twice. The list is already
  // sorted best-first, so the first occurrence of each domain is the strongest match.
  const seen = new Set<string>();
  const unique: ComparableSaleMatch[] = [];
  for (const record of scored) {
    if (seen.has(record.domain)) continue;
    seen.add(record.domain);
    unique.push(record);
    if (unique.length >= limit) break;
  }

  return unique;
}

export async function loadMarketData(): Promise<MarketDataResult> {
  if (marketDataPromise) {
    return marketDataPromise;
  }

  marketDataPromise = (async () => {
    const hasSnapshotDataset = await fs
      .access(SNAPSHOT_DATASET_PATH)
      .then(() => true)
      .catch(() => false);

    if (hasSnapshotDataset) {
      return loadSnapshotData();
    }

    const hasMasterDataset = await fs
    .access(MASTER_DATASET_PATH)
    .then(() => true)
    .catch(() => false);

    const records = dedupeRecords(
      (hasMasterDataset ? await loadMasterRecords() : await loadRawRecords())
        .filter((record) => record.salePriceUsd > 0),
    )
      .sort((a, b) => {
        if (a.saleDateTimestamp && b.saleDateTimestamp) {
          return b.saleDateTimestamp - a.saleDateTimestamp;
        }
        if (a.saleDateTimestamp) return -1;
        if (b.saleDateTimestamp) return 1;
        return b.salePriceUsd - a.salePriceUsd;
      });

    if (records.length === 0) {
      return {
        latestReportedSales: [],
        summary: {
          totalSalesRecords: 0,
          medianSalePrice: 0,
          highestReportedSale: null,
          mostActiveTld: ".com",
          bestPerformingTldByMedianPrice: ".com",
        },
        tldPerformance: [],
        categoryBreakdown: [],
        priceDistribution: [
          { range: "$0-$1k", count: 0 },
          { range: "$1k-$5k", count: 0 },
          { range: "$5k-$10k", count: 0 },
          { range: "$10k-$50k", count: 0 },
          { range: "$50k+", count: 0 },
        ],
        anomalies: [],
        availableTlds: [],
        availableCategories: [],
        dataSource: "empty",
      };
    }

    const latestReportedSales = records.slice(0, 600);
    const summary = buildSummary(records);
    const tldPerformance = buildTldPerformance(records);
    const categoryBreakdown = buildCategoryBreakdown(records);
    const priceDistribution = buildPriceDistribution(records);
    const anomalies = buildMarketAnomalies(records);
    const availableTlds = [...new Set(records.map((record) => record.tld))].sort();
    const availableCategories = [...new Set(records.map((record) => record.category))].sort();

    return {
      latestReportedSales,
      summary,
      tldPerformance,
      categoryBreakdown,
      priceDistribution,
      anomalies,
      availableTlds,
      availableCategories,
      dataSource: hasMasterDataset ? "processed" : "raw",
    };
  })();

  try {
    return await marketDataPromise;
  } catch (error) {
    marketDataPromise = null;
    throw error;
  }
}
