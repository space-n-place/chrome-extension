import { Listing } from "../types";
import { enrichWithHeuristics } from "./heuristics";
import { extractJsonLd, findOfferFromJsonLd } from "../utils/jsonld";
import { extractOpenGraph, extractTwitter, getMeta } from "../utils/meta";
import {
  detectCurrency,
  parseNumber,
  pickFirst,
  toSquareMeters,
} from "../utils/normalize";
import {
  extractGeoFromJsonLd,
  extractGeoFromPageText,
} from "../utils/geolocation";
import { extractPropertyImages } from "../utils/images";

function extractImagesOg(): string[] {
  const og = extractOpenGraph();
  const images: string[] = [];
  for (const key of Object.keys(og)) {
    if (key.startsWith("og:image")) images.push(og[key]);
  }
  return Array.from(new Set(images));
}

/**
 * Извлекает геолокацию из различных источников
 */
function extractGeolocation(
  offer: any
): { latitude: number; longitude: number } | null {
  // 1. Из JSON-LD
  const geoFromJsonLd = extractGeoFromJsonLd(offer);
  if (geoFromJsonLd) return geoFromJsonLd;

  // 2. Из текста страницы
  const geoFromPage = extractGeoFromPageText();
  if (geoFromPage) return geoFromPage;

  return null;
}

function inferTransactionFromText(
  text?: string | null
): Listing["transactionType"] {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/(rent|aluguel|alquiler|miete|аренда|nájem|임대|賃貸|租)/.test(t))
    return "rent";
  if (/(sale|venta|venda|verkauf|продажа|prodaja|sprzedaż|продам)/.test(t))
    return "sale";
  return null;
}

export async function parseGeneric(): Promise<Partial<Listing>> {
  const url = location.href;
  const jsonlds = extractJsonLd();
  const og = extractOpenGraph();
  const tw = extractTwitter();

  const offer = findOfferFromJsonLd(jsonlds);
  const raw = offer || jsonlds[0] || null;

  const title = pickFirst(
    (offer as any)?.name,
    og["og:title"],
    getMeta("title"),
    document.querySelector("h1")?.textContent?.trim() || undefined
  );

  const description = pickFirst(
    (offer as any)?.description,
    og["og:description"],
    getMeta("description"),
    tw["twitter:description"]
  );

  const currencyFromText =
    detectCurrency(
      String(
        (offer as any)?.priceCurrency ||
          (offer as any)?.priceSpecification?.priceCurrency ||
          ""
      ) +
        " " +
        String(
          (offer as any)?.price ||
            (offer as any)?.priceSpecification?.price ||
            ""
        )
    ) ||
    detectCurrency(og["og:price:amount"] || "") ||
    detectCurrency(description || "") ||
    detectCurrency(title || "");

  const priceNum = pickFirst(
    parseNumber((offer as any)?.price),
    parseNumber((offer as any)?.priceSpecification?.price),
    parseNumber(og["og:price:amount"]),
    parseNumber(
      (
        document.querySelector(
          '[itemprop="price"],[data-testid*="price" i]'
        ) as HTMLElement
      )?.innerText
    )
  );

  const price =
    priceNum != null
      ? {
          amount: priceNum,
          currency:
            (offer as any)?.priceCurrency ||
            (offer as any)?.priceSpecification?.priceCurrency ||
            currencyFromText ||
            null,
        }
      : undefined;

  const areaNum = pickFirst(
    parseNumber((offer as any)?.floorSize?.value),
    parseNumber((offer as any)?.area),
    parseNumber(
      (
        document.querySelector(
          '[itemprop="floorSize"],[data-testid*="area" i], [class*="area" i]'
        ) as HTMLElement
      )?.innerText
    )
  );

  const areaUnit = pickFirst(
    (offer as any)?.floorSize?.unitText as string | undefined,
    (offer as any)?.floorSize?.unitCode as string | undefined,
    "m2"
  );
  const area = toSquareMeters(areaNum ?? null, areaUnit ?? undefined);

  // Цена за квадратный метр — грубая оценка
  const pricePerAreaAmount =
    area.value && priceNum != null && area.value > 0
      ? priceNum / area.value
      : null;
  const pricePerArea =
    pricePerAreaAmount != null
      ? {
          amount: Math.round(pricePerAreaAmount),
          currency: (offer as any)?.priceCurrency || currencyFromText || null,
        }
      : undefined;

  const rooms = {
    rooms: pickFirst(
      parseNumber((offer as any)?.numberOfRooms),
      parseNumber(
        (
          document.querySelector(
            '[itemprop="numberOfRooms"], [data-testid*="rooms" i]'
          ) as HTMLElement
        )?.innerText
      )
    ),
    bedrooms: pickFirst(
      parseNumber((offer as any)?.numberOfBedrooms),
      parseNumber(
        (
          document.querySelector(
            '[itemprop="numberOfBedrooms"], [data-testid*="bedroom" i]'
          ) as HTMLElement
        )?.innerText
      )
    ),
    bathrooms: pickFirst(
      parseNumber((offer as any)?.numberOfBathroomsTotal),
      parseNumber(
        (
          document.querySelector(
            '[itemprop*="bathroom" i], [data-testid*="bath" i]'
          ) as HTMLElement
        )?.innerText
      )
    ),
  };

  const addressNode: any =
    (offer as any)?.address || (offer as any)?.object?.address || null;

  // Извлекаем геолокацию
  const geolocation = extractGeolocation(offer);

  const address = addressNode
    ? typeof addressNode === "string"
      ? {
          country: null,
          region: null,
          city: null,
          street: null,
          postalCode: null,
          formatted: addressNode,
          latitude: geolocation?.latitude || null,
          longitude: geolocation?.longitude || null,
        }
      : {
          country: addressNode.addressCountry || null,
          region: addressNode.addressRegion || null,
          city: addressNode.addressLocality || null,
          street: addressNode.streetAddress || null,
          postalCode: addressNode.postalCode || null,
          formatted:
            addressNode.streetAddress ||
            document
              .querySelector('[itemprop="address"]')
              ?.textContent?.trim() ||
            null,
          latitude: geolocation?.latitude || null,
          longitude: geolocation?.longitude || null,
        }
    : geolocation
      ? {
          country: null,
          region: null,
          city: null,
          street: null,
          postalCode: null,
          formatted: null,
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
        }
      : undefined;

  const propertyType = pickFirst(
    (offer as any)?.["@type"],
    (offer as any)?.itemOffered?.["@type"],
    getMeta("og:type")
  ) as string | null;

  // Улучшенное извлечение изображений
  const smartImages = await extractPropertyImages();
  const ogImages = extractImagesOg();

  // Объединяем: сначала умные изображения, потом OG (если нет дубликатов)
  const images = [
    ...smartImages,
    ...ogImages.filter((og) => !smartImages.includes(og)),
  ];

  const transactionType = pickFirst(
    inferTransactionFromText((offer as any)?.name),
    inferTransactionFromText(description),
    inferTransactionFromText(title)
  );

  const result: Partial<Listing> = {
    url,
    title,
    description,
    price,
    pricePerArea,
    area: { value: area.value, unit: area.unit },
    rooms,
    address,
    images,
    propertyType,
    transactionType,
    source: {
      domain: location.hostname,
      extractedAt: new Date().toISOString(),
      method: raw ? "jsonld" : "hybrid",
    },
    raw,
  };

  // Дополнительное обогащение эвристиками DOM
  const enriched = enrichWithHeuristics(result);
  return enriched;
}
