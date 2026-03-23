import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;

interface FirecrawlResult {
  url: string;
  markdown: string;
  metadata?: { title?: string; description?: string };
}

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY")!;

interface ScrapedPermit {
  title: string;
  description: string | null;
  location: string | null;
  permit_number: string | null;
  source: string;
  url: string;
  city: string;
  project_type: string | null;
  estimated_value: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

const PERMIT_SOURCES = [
  { city: "toronto", url: "https://www.toronto.ca/city-government/data-research-maps/open-data/open-data-catalogue/development-applications/", label: "Toronto Building Permits" },
  { city: "montreal", url: "https://donnees.montreal.ca/dataset/permis-de-construire", label: "Montréal Permis" },
  { city: "vancouver", url: "https://vancouver.ca/home-property-development/issued-building-permits.aspx", label: "Vancouver Building Permits" },
  { city: "calgary", url: "https://data.calgary.ca/Business-and-Economic-Activity/Building-Permits/c2es-76ed", label: "Calgary Building Permits" },
  { city: "ottawa", url: "https://ottawa.ca/en/planning-development-and-construction/building-and-renovating/building-permits/applied-and-issued-building-permits", label: "Ottawa Building Permits" },
  { city: "edmonton", url: "https://data.edmonton.ca/Urban-Planning-Economy/Building-Permits/24uj-dj8v", label: "Edmonton Building Permits" },
  { city: "winnipeg", url: "https://data.winnipeg.ca/Public-Safety/Building-Permits/9yey-m6xk", label: "Winnipeg Building Permits" },
  { city: "quebec", url: "https://donnees.ville.quebec.qc.ca/dataset/permis-de-construction", label: "Québec Permis" },
  { city: "halifax", url: "https://data-halifax.opendata.arcgis.com/datasets/halifax::building-permits/explore", label: "Halifax Building Permits" },
  { city: "victoria", url: "https://opendata.victoria.ca/datasets/victoria::building-permits/explore", label: "Victoria Building Permits" },
  { city: "saskatoon", url: "https://data.saskatoon.ca/Public-Safety-and-Health/Building-Permits/asv8-m6xk", label: "Saskatoon Building Permits" },
  { city: "regina", url: "https://open.regina.ca/dataset/building-permits", label: "Regina Building Permits" },
  { city: "brampton", url: "https://geohub.brampton.ca/datasets/brampton::building-permits-active/explore", label: "Brampton Building Permits" },
  { city: "london", url: "https://opendata.london.ca/datasets/london-ontario::building-permit-applications/explore", label: "London Building Permits" },
  { city: "surrey", url: "https://data.surrey.ca/dataset/building-permits", label: "Surrey Building Permits" },
  { city: "mississauga", url: "https://data.mississauga.ca/datasets/mississauga::building-permits-monthly/explore", label: "Mississauga Building Permits" }
];

async function geocodeAddress(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY || !address) return null;
  try {
    const fullAddress = `${address}, ${city}, Canada`;
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}&internalUsageAttributionIds=gmp_mcp_codeassist_v0.1_github`);
    const data = await res.json();
    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location;
    }
  } catch (err) {
    console.error(`Geocode failed for ${address}:`, err);
  }
  return null;
}

function detectProjectType(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("hvac") || lower.includes("heating") || lower.includes("cooling") || lower.includes("furnace")) return "hvac";
  if (lower.includes("roof") || lower.includes("shingle") || lower.includes("toiture")) return "roofing";
  if (lower.includes("plumb") || lower.includes("plomberie") || lower.includes("drain")) return "plumbing";
  if (lower.includes("electric") || lower.includes("électr")) return "electrical";
  if (lower.includes("landscape") || lower.includes("paysag")) return "landscaping";
  if (lower.includes("renovat") || lower.includes("rénovation") || lower.includes("addition")) return "renovations";
  if (lower.includes("new build") || lower.includes("construction") || lower.includes("foundation")) return "general";
  return null;
}

function extractEstimatedValue(text: string): number | null {
  const matches = text.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (!matches) return null;
  const values = matches.map((m) => parseFloat(m.replace(/[$,]/g, "")));
  return Math.max(...values) || null;
}

async function scrapeWithFirecrawl(url: string): Promise<FirecrawlResult | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      }),
    });

    if (!res.ok) {
      console.error(`Firecrawl error for ${url}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.data ?? null;
  } catch (err) {
    console.error(`Scrape failed for ${url}:`, err);
    return null;
  }
}

function parsePermitsFromMarkdown(markdown: string, city: string, sourceUrl: string): ScrapedPermit[] {
  const permits: ScrapedPermit[] = [];
  const lines = markdown.split("\n").filter((l) => l.trim());

  const permitPattern = /(?:permit|permis|application|#)\s*[\w-]+/i;
  const addressPattern = /\d+\s+[\w\s]+(?:st|ave|blvd|rd|dr|way|cres|pl|court|lane|street|avenue|boulevard|road|drive|crescent|place)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length < 20 || line.length > 500) continue;

    const hasPermitRef = permitPattern.test(line);
    const hasAddress = addressPattern.test(line);

    if (hasPermitRef || hasAddress) {
      const context = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3)).join(" ");
      const projectType = detectProjectType(context);
      const estimatedValue = extractEstimatedValue(context);

      const permitMatch = context.match(/(?:permit|permis|#)\s*([\w-]+)/i);
      const permitNumber = permitMatch?.[1] ?? null;

      permits.push({
        title: line.trim().substring(0, 200),
        description: context.trim().substring(0, 500),
        location: hasAddress ? line.trim() : null,
        permit_number: permitNumber,
        source: city.charAt(0).toUpperCase() + city.slice(1) + " Open Data",
        url: sourceUrl,
        city,
        project_type: projectType,
        estimated_value: estimatedValue,
      });

      if (permits.length >= 20) break; 
    }
  }

  return permits;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalGeocoded = 0;
  const errors: string[] = [];

  console.log(`Starting Firecrawl permit scrape and Google Geocoding for ${PERMIT_SOURCES.length} cities`);

  for (const source of PERMIT_SOURCES) {
    try {
      console.log(`Scraping ${source.city}...`);
      const result = await scrapeWithFirecrawl(source.url);

      if (!result?.markdown) {
        errors.push(`No content from ${source.city}`);
        continue;
      }

      const permits = parsePermitsFromMarkdown(result.markdown, source.city, source.url);
      console.log(`Found ${permits.length} permits in ${source.city}`);

      for (const permit of permits) {
        let latitude = null;
        let longitude = null;

        if (permit.location) {
          const coords = await geocodeAddress(permit.location, permit.city);
          if (coords) {
            latitude = coords.lat;
            longitude = coords.lng;
            totalGeocoded++;
          }
        }

        const { error } = await supabase
          .from("scraped_inventory")
          .upsert(
            { ...permit, latitude, longitude, scraped_at: new Date().toISOString() },
            { onConflict: "url,permit_number", ignoreDuplicates: true }
          );

        if (error) {
          totalSkipped++;
        } else {
          totalInserted++;
        }
      }
    } catch (err: any) {
      errors.push(`${source.city}: ${err.message}`);
    }
  }

  const duration = Date.now() - startTime;

  // Log the scrape run
  await supabase.from("automated_logs").insert({
    event_type: "firecrawl.scrape_complete",
    channel: "firecrawl",
    status: errors.length === PERMIT_SOURCES.length ? "failed" : "sent",
    subject: `Scraped ${totalInserted} permits in ${duration}ms`,
    metadata: { inserted: totalInserted, skipped: totalSkipped, errors, duration_ms: duration },
  });

  console.log(`Scrape complete: ${totalInserted} inserted, ${totalSkipped} skipped, ${errors.length} errors`);

  return new Response(
    JSON.stringify({ inserted: totalInserted, skipped: totalSkipped, errors, duration_ms: duration }),
    { headers: { "Content-Type": "application/json" } }
  );
});
