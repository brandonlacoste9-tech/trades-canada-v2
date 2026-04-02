export type Brand = "CANADA" | "USA";

export interface BrandConfig {
  name: string;
  domain: string;
  country: string;
  adjective: string;
  defaultLocale: string;
  locales: string[];
  cities: string[];
  twitter: string;
  email: string;
  currency: string;
}

const BRANDS: Record<Brand, BrandConfig> = {
  CANADA: {
    name: "Trades-Canada",
    domain: "trades-canada.com",
    country: "Canada",
    adjective: "Canadian",
    defaultLocale: "en",
    locales: ["en", "fr"],
    cities: ["Toronto", "Vancouver", "Calgary", "Montreal", "Ottawa"],
    twitter: "@tradescanada",
    email: "hello@trades-canada.com",
    currency: "CAD",
  },
  USA: {
    name: "Trades-USA",
    domain: "trades-usa.com",
    country: "USA",
    adjective: "American",
    defaultLocale: "en",
    locales: ["en", "es"], // American version usually targets English and Spanish
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami"],
    twitter: "@tradesusa",
    email: "hello@trades-usa.com",
    currency: "USD",
  },
};

// Default to CANADA if not specified
export const BRAND_ID: Brand = (process.env.NEXT_PUBLIC_BRAND as Brand) || "CANADA";
export const brand = BRANDS[BRAND_ID];
