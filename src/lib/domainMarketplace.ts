export type ResaleStatus =
  | "not_listed"
  | "listed_for_sale"
  | "possibly_listed"
  | "needs_verification"
  | "unknown";

export type MarketplaceStatus = "available" | "taken" | "unknown";

function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .replace(/\s+/g, "");
}

async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function getMarketplaceStatus(domainInput: string) {
  const domain = normalizeDomain(domainInput);

  const result: {
    status: MarketplaceStatus | undefined;
    resaleStatus: ResaleStatus;
    detectedMarketplace?: string | null;
    marketplaceName?: string | null;
    askingPrice?: number | null;
    landingPageDetected?: boolean;
    confidence?: "high" | "medium" | "low";
    marketplaceLinks?: Record<string, string> | null;
    notes?: string | null;
  } = {
    status: undefined,
    resaleStatus: "unknown",
    detectedMarketplace: null,
    landingPageDetected: false,
    confidence: "low",
    marketplaceLinks: null,
    notes: null,
  };

  // 1) RDAP lookup to determine registration
  try {
    const rdapUrl = `https://rdap.org/domain/${domain}`;
    const rdapRes = await fetchWithTimeout(rdapUrl, 5000);

    if (rdapRes.ok) {
      // registered
      result.status = "taken";
    } else if (rdapRes.status === 404) {
      result.status = "available";
      result.resaleStatus = "not_listed";
      result.confidence = "high";
      result.marketplaceLinks = marketplaceLinks(domain);
      return result;
    }
  } catch (err) {
    // If RDAP fails, leave status unknown but continue tries
    result.notes = (err as Error).message;
  }

  // 2) If registered (or unknown), fetch https://{domain} and detect patterns
  try {
    const pageRes = await fetchWithTimeout(`https://${domain}`, 6000);

    if (pageRes && pageRes.ok) {
      result.landingPageDetected = true;
      const text = (await pageRes.text()).toLowerCase();

      // Detect bot protection / verification
      const blockedPhrases = [
        "checking your browser",
        "verify you are human",
        "captcha",
        "cloudflare",
        "attention required",
        "access denied",
      ];

      const hasBlocked = blockedPhrases.some((p) => text.includes(p));
      if (hasBlocked) {
        result.resaleStatus = "needs_verification";
        result.confidence = "low";
        result.notes = "Landing page requires verification or shows bot protection.";
        result.marketplaceLinks = marketplaceLinks(domain);
        return result;
      }

      // Marketplace / resale phrases
      const salePhrases = [
        "this domain is for sale",
        "buy this domain",
        "make an offer",
        "sedo",
        "afternic",
        "dan.com",
        "hugedomains",
        "godaddy auctions",
      ];

      const marketplaces = [
        { id: "sedo", name: "Sedo" },
        { id: "godaddy", name: "GoDaddy" },
        { id: "afternic", name: "Afternic" },
        { id: "dan.com", name: "Dan.com" },
        { id: "hugedomains", name: "HugeDomains" },
        { id: "flippa", name: "Flippa" },
      ];

      const foundSale = salePhrases.find((p) => text.includes(p));
      const foundMarket = marketplaces.find((m) => text.includes(m.id) || text.includes(m.name.toLowerCase()));

      if (foundSale) {
        result.resaleStatus = "listed_for_sale";
        result.confidence = "high";
      }

      if (foundMarket) {
        result.detectedMarketplace = foundMarket.name;
        result.marketplaceName = foundMarket.name;
        if (result.resaleStatus !== "listed_for_sale") {
          result.resaleStatus = "possibly_listed";
          result.confidence = result.confidence === "high" ? "high" : "medium";
        }
      }

      // Extract asking price heuristically
      const moneyMatch = text.match(/\$\s?([0-9]{1,3}(?:[,0-9]{0,3})+)/i);
      if (moneyMatch) {
        const n = Number(moneyMatch[1].replace(/,/g, ""));
        if (!Number.isNaN(n)) result.askingPrice = n;
      } else {
        const usdMatch = text.match(/usd\s?([0-9,]+)/i);
        if (usdMatch) {
          const n = Number(usdMatch[1].replace(/,/g, ""));
          if (!Number.isNaN(n)) result.askingPrice = n;
        }
      }

      // Set marketplace links for user verification
      result.marketplaceLinks = marketplaceLinks(domain);

      // If nothing found, mark not_listed with medium confidence
      if (!foundSale && !foundMarket && !result.askingPrice) {
        result.resaleStatus = result.resaleStatus === "unknown" ? "not_listed" : result.resaleStatus;
        result.confidence = "medium";
      }
    } else {
      // If domain taken but no landing page or unreachable, mark possibly_listed
      if (result.status === "taken") {
        result.resaleStatus = "possibly_listed";
        result.confidence = "low";
        result.marketplaceLinks = marketplaceLinks(domain);
      }
    }
  } catch (err) {
    if (result.status === "taken") {
      result.resaleStatus = "possibly_listed";
      result.confidence = "low";
      result.marketplaceLinks = marketplaceLinks(domain);
    }
    result.notes = (err as Error).message;
  }

  return result;
}

// Helper links for manual verification
export const marketplaceLinks = (domain: string) => {
  const parts = domain.split(".");
  const name = parts.slice(0, -1).join(".");
  const tld = parts[parts.length - 1] ?? "";
  return {
    sedo: `https://sedo.com/search/details/?domain=${domain}`,
    godaddy: `https://www.godaddy.com/domainsearch/find?domainToCheck=${domain}`,
    afternic: `https://www.afternic.com/domain/${domain}`,
    dan: `https://dan.com/buy-domain/${domain}`,
    hugedomains: `https://www.hugedomains.com/domain_profile.cfm?d=${encodeURIComponent(name)}&e=${encodeURIComponent(tld)}`,
  };
};
