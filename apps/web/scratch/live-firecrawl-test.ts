
// ─── Live Firecrawl Test ──────────────────────────────────────────────────
// Uses the provided API key to scrape a real Toronto Open Data page
// and verify if our parser can extract meaningful permits.

const FIRECRAWL_API_KEY = "fc-9ba4e37c3cb34825b9f56af46274e9c4";
const TARGET_URL = "https://open.toronto.ca/dataset/building-permits-active-permits/";

async function scrapeWithFirecrawl(url: string) {
  console.log(`Scraping ${url}...`);
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.error(`Firecrawl Error: ${res.status}`, err);
      return null;
    }
    
    const data = await res.json();
    return data.data?.markdown || null;
  } catch (err) {
    console.error("Fetch failed:", err);
    return null;
  }
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

function parsePermitsFromMarkdown(markdown: string, city: string) {
  const permits = [];
  const lines = markdown.split("\n").map(l => l.trim()).filter((l) => l.length > 5);

  const permitPattern = /(?:permit|permis|application|#)\s*[:#\s]*([A-Z0-9-]{4,})/i;
  const addressPattern = /\b(\d+)\s+([A-Z0-9\s.]+ (?:st|ave|blvd|rd|dr|way|cres|pl|court|lane|street|avenue|boulevard|road|drive|crescent|place))\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const permitMatch = line.match(permitPattern);
    const addressMatch = line.match(addressPattern);

    if (permitMatch || addressMatch) {
      if (line.toLowerCase().includes("department") || line.toLowerCase().includes("manual")) continue;
      
      const context = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3)).join(" ");
      const projectType = detectProjectType(context);
      const estimatedValue = extractEstimatedValue(context);
      const permitNumber = permitMatch ? permitMatch[1] : null;
      const location = addressMatch ? addressMatch[0] : null;

      if (permits.some(p => p.permit_number === permitNumber && p.permit_number !== null)) continue;

      permits.push({
        title: line.substring(0, 200),
        location,
        permit_number: permitNumber,
        city,
        project_type: projectType,
        estimated_value: estimatedValue,
      });
    }
  }
  return permits;
}

async function main() {
  const markdown = await scrapeWithFirecrawl(TARGET_URL);
  if (!markdown) {
    console.error("No markdown content returned.");
    return;
  }

  console.log("\n--- Scraping Finished ---");
  console.log(`Markdown size: ${markdown.length} chars`);
  
  const results = parsePermitsFromMarkdown(markdown, "toronto");
  console.log(`\nFound ${results.length} potentials in raw markdown.`);
  
  results.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. [${p.project_type || 'Unknown'}] ${p.permit_number || 'No Permit #'} at ${p.location || 'No Location'}`);
  });
}

main();
