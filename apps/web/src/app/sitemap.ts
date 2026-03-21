import type { MetadataRoute } from "next";
import { cities } from "@/lib/cityData";

const BASE_URL = "https://trades-canada.com";
const LANGS = ["en", "fr"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Root redirect
  const rootEntries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];

  // Home pages per language
  const homeEntries: MetadataRoute.Sitemap = LANGS.map((lang) => ({
    url: `${BASE_URL}/${lang}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1.0,
  }));

  // Static pages per language
  const staticPages = ["booking", "auth"];
  const staticEntries: MetadataRoute.Sitemap = LANGS.flatMap((lang) =>
    staticPages.map((page) => ({
      url: `${BASE_URL}/${lang}/${page}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  // City pages per language — highest SEO priority
  const cityEntries: MetadataRoute.Sitemap = LANGS.flatMap((lang) =>
    cities.map((city) => ({
      url: `${BASE_URL}/${lang}/city/${city.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }))
  );

  return [...rootEntries, ...homeEntries, ...staticEntries, ...cityEntries];
}
