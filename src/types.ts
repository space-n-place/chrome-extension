export type Money = {
  amount: number | null;
  currency: string | null;
};

export type Address = {
  country?: string | null;
  region?: string | null; // state/province
  city?: string | null;
  district?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  formatted?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type Media = {
  url: string;
  type: "image" | "video";
};

export type Area = {
  value: number | null; // square meters
  unit?: string | null; // m2, sqft
};

export type RoomInfo = {
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
};

export type Listing = {
  id?: string | null;
  url: string;
  title?: string | null;
  description?: string | null;
  price?: Money;
  pricePerArea?: Money;
  area?: Area;
  lotArea?: Area;
  floor?: number | null;
  totalFloors?: number | null;
  yearBuilt?: number | null;
  propertyType?: string | null; // apartment, house, condo, etc
  transactionType?: "sale" | "rent" | "lease" | "auction" | null;
  furnished?: boolean | null;
  condition?: string | null;
  rooms?: RoomInfo;
  address?: Address;
  amenities?: string[];
  media?: Media[];
  images?: string[]; // convenience mirror of media (image)
  seller?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    type?: string | null; // agent, owner, builder, etc
  } | null;
  source: {
    domain: string;
    extractedAt: string; // ISO timestamp
    method: "jsonld" | "opengraph" | "meta" | "dom" | "hybrid";
  };
  raw?: unknown; // raw json-ld / fragments for debugging
};

export type DomainParser = {
  test: (location: Location) => boolean;
  parse: () => Partial<Listing> | Promise<Partial<Listing>>;
  name: string;
};
