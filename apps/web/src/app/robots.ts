import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*/dashboard", "/*/settings", "/*/auth/callback", "/api/"],
      },
    ],
    sitemap: "https://trades-canada.com/sitemap.xml",
    host: "https://trades-canada.com",
  };
}
