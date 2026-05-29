export type WatchItem = {
  _id?: string;
  domain: string;
  score?: number;
  availabilityStatus?: string;
  resaleStatus?: string | null;
  estimatedValueUsd?: number | null;
  registrar?: string | null;
  expiresAt?: string | null;
  lastCheckedAt?: string | null;
  createdAt?: number;
  updatedAt?: number;
};

export async function recheckDomain(domain: string) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });

  if (!res.ok) {
    throw new Error("Recheck failed");
  }

  return await res.json();
}
