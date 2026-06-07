const USD_TO_INR = 83;
const MAX_DISPLAYABLE_USD = 50_000_000;

export function usdToInr(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  if (Math.abs(value) > MAX_DISPLAYABLE_USD) return null;
  return Math.round(value * USD_TO_INR);
}

export function formatInrFromUsd(value: number | null | undefined) {
  if (value === null || value === undefined) return "Not available";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(usdToInr(value) ?? 0);
}

export function formatInrAxisFromUsd(value: number) {
  const inrValue = usdToInr(value) ?? 0;

  if (inrValue >= 100000) {
    return `₹${Math.round(inrValue / 100000)}L`;
  }

  if (inrValue >= 1000) {
    return `₹${Math.round(inrValue / 1000)}k`;
  }

  return `₹${inrValue}`;
}
