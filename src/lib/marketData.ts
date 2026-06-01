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

export type MarketDataResult = {
  latestReportedSales: MarketSaleRecord[];
  summary: MarketSummary;
  tldPerformance: TldPerformanceRow[];
  categoryBreakdown: CategoryBreakdownRow[];
  priceDistribution: PriceDistributionRow[];
  availableTlds: string[];
  availableCategories: string[];
  dataSource: "processed" | "raw" | "empty";
};

const ROOT = process.cwd();
const MASTER_DATASET_PATH = path.join(ROOT, "data", "processed", "domain_sales_master.csv");
const RAW_DATA_DIR = path.join(ROOT, "data", "raw");
let marketDataPromise: Promise<MarketDataResult> | null = null;

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

function inferWordCount(domain: string) {
  const name = inferName(domain);
  const parts = name.split(/[-_]/).filter(Boolean);
  return parts.length > 0 ? parts.length : 1;
}

function inferCharLength(domain: string) {
  return inferName(domain).replace(/\./g, "").length;
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

export async function loadMarketData(): Promise<MarketDataResult> {
  if (marketDataPromise) {
    return marketDataPromise;
  }

  marketDataPromise = (async () => {
  const hasMasterDataset = await fs
    .access(MASTER_DATASET_PATH)
    .then(() => true)
    .catch(() => false);

    const records = (hasMasterDataset ? await loadMasterRecords() : await loadRawRecords())
      .filter((record) => record.salePriceUsd > 0)
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
    const availableTlds = [...new Set(records.map((record) => record.tld))].sort();
    const availableCategories = [...new Set(records.map((record) => record.category))].sort();

    return {
      latestReportedSales,
      summary,
      tldPerformance,
      categoryBreakdown,
      priceDistribution,
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
