export type DomainAvailabilityStatus = "Available" | "Taken" | "Unknown";

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getMockAvailabilityStatus(
  domain: string,
): DomainAvailabilityStatus {
  const hash = hashString(domain);
  const bucket = hash % 9;

  if (bucket <= 2) {
    return "Available";
  }

  if (bucket <= 6) {
    return "Taken";
  }

  return "Unknown";
}
