import { DomainParser, Listing } from "../../types";
import { parseGeneric } from "../generic";

export const immoScout24Parser: DomainParser = {
  name: "immoscout24",
  test: (loc) =>
    /(^|\.)(immobilienscout24|immoscout24)\.(de|ch)$/i.test(loc.hostname),
  parse: async (): Promise<Partial<Listing>> => parseGeneric(),
};

