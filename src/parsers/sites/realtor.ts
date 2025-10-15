import { DomainParser, Listing } from "../../types";
import { parseGeneric } from "../generic";

export const realtorParser: DomainParser = {
  name: "realtor",
  test: (loc) => /(^|\.)realtor\.(com|ca)$/i.test(loc.hostname),
  parse: async (): Promise<Partial<Listing>> => {
    // Часто достаточно generic + json-ld
    return await parseGeneric();
  },
};
