export function extractJsonLd(): unknown[] {
  const scripts = Array.from(
    document.querySelectorAll('script[type="application/ld+json"]')
  );
  const results: unknown[] = [];
  for (const script of scripts) {
    try {
      const text = script.textContent?.trim();
      if (!text) continue;
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else {
        results.push(parsed);
      }
    } catch (_) {
      // ignore malformed json-ld
    }
  }
  return results;
}

export function findOfferFromJsonLd(jsonlds: unknown[]): any | null {
  for (const obj of jsonlds) {
    const node: any = obj;
    if (!node || typeof node !== "object") continue;
    const type = node["@type"] || node.type;
    if (!type) continue;

    // Listing types in schema.org
    const types = Array.isArray(type) ? type : [type];
    if (
      types.includes("Offer") ||
      types.includes("Residence") ||
      types.includes("Apartment") ||
      types.includes("House") ||
      types.includes("SingleFamilyResidence") ||
      types.includes("Product") ||
      types.includes("RealEstateListing") ||
      types.includes("RentAction") ||
      types.includes("BuyAction") ||
      types.includes("SellAction")
    ) {
      return node;
    }
    // sometimes listing is nested inside
    if (node["offers"]) return node["offers"];
  }
  return null;
}
