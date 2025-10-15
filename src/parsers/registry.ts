import { Listing, DomainParser } from "../types";
import { parseGeneric } from "./generic";
import { enrichWithHeuristics } from "./heuristics";
import { zillowParser } from "./sites/zillow";
import { realtorParser } from "./sites/realtor";
import { rightmoveParser } from "./sites/rightmove";
import { idealistaParser } from "./sites/idealista";
import { immoScout24Parser } from "./sites/immoscout24";

// Только специализированные парсеры с кастомной логикой
const domainParsers: DomainParser[] = [
  zillowParser,
  realtorParser,
  rightmoveParser,
  idealistaParser,
  immoScout24Parser,
];

export async function parseWithRegistry(): Promise<Partial<Listing>> {
  const locationObj = window.location;
  for (const parser of domainParsers) {
    try {
      if (parser.test(locationObj)) {
        const data = await parser.parse();
        const enriched = enrichWithHeuristics({ ...data });
        return {
          ...enriched,
          source: {
            domain: location.hostname,
            extractedAt: new Date().toISOString(),
            method: "dom",
          },
          url: location.href,
        };
      }
    } catch {
      // пропускаем неудавшиеся доменные парсеры
    }
  }

  const genericData = await parseGeneric();
  return genericData;
}
