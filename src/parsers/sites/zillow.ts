import { DomainParser, Listing } from "../../types";
import { parseGeneric } from "../generic";
import { parseNumber, detectCurrency } from "../../utils/normalize";

export const zillowParser: DomainParser = {
  name: "zillow",
  test: (loc) => /(^|\.)zillow\.com$/i.test(loc.hostname),
  parse: async (): Promise<Partial<Listing>> => {
    // Простая адаптация: иногда Zillow хранит данные в __NEXT_DATA__
    const script = document.getElementById("__NEXT_DATA__");
    if (script?.textContent) {
      try {
        const data = JSON.parse(script.textContent);
        const home = data?.props?.pageProps?.componentData?.gdpClientCache;
        const firstKey = home ? Object.keys(home)[0] : null;
        const payload = firstKey ? home[firstKey]?.property : null;
        if (payload) {
          const priceNum =
            parseNumber(payload.price) ?? parseNumber(payload.unformattedPrice);
          return {
            title:
              payload.streetAddress ||
              payload.hdpData?.homeInfo?.streetAddress ||
              document.title,
            price:
              priceNum != null
                ? {
                    amount: priceNum,
                    currency: detectCurrency(document.body.innerText),
                  }
                : undefined,
            address: {
              city: payload.city || payload.hdpData?.homeInfo?.city,
              region: payload.state || payload.hdpData?.homeInfo?.state,
              postalCode: payload.zipcode || payload.hdpData?.homeInfo?.zipcode,
              formatted: payload.streetAddress
                ? `${payload.streetAddress}, ${payload.city}, ${payload.state} ${payload.zipcode}`
                : null,
            },
            images: Array.isArray(payload.images) ? payload.images : undefined,
          };
        }
      } catch (_) {
        // fallback
      }
    }
    return await parseGeneric();
  },
};
