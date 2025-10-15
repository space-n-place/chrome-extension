import { DomainParser, Listing } from "../../types";
import { parseGeneric } from "../generic";

export const idealistaParser: DomainParser = {
  name: "idealista",
  test: (loc) => /(^|\.)idealista\.(com|it|pt|es)$/i.test(loc.hostname),
  parse: async (): Promise<Partial<Listing>> => parseGeneric(),
};

