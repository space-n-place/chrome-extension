import { DomainParser, Listing } from "../../types";
import { parseGeneric } from "../generic";

export const rightmoveParser: DomainParser = {
  name: "rightmove",
  test: (loc) => /(^|\.)rightmove\.co\.uk$/i.test(loc.hostname),
  parse: async (): Promise<Partial<Listing>> => parseGeneric(),
};

