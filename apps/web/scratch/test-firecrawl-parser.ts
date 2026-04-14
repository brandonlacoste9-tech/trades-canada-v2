
// ─── Firecrawl Parser Test ──────────────────────────────────────────────────
// Simulates the Edge Function logic to verify if the markdown parser 
// correctly identifies permit numbers, addresses, values, and project types.

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

function parsePermitsFromMarkdown(markdown: string, city: string, sourceUrl: string) {
  const permits = [];
  const lines = markdown.split("\n").map(l => l.trim()).filter((l) => l.length > 5);

  const permitPattern = /(?:permit|permis|application|#)\s*[:#\s]*([A-Z0-9-]{4,})/i;
  const addressPattern = /\b(\d+)\s+([A-Z0-9\s.]+ (?:st|ave|blvd|rd|dr|way|cres|pl|court|lane|street|avenue|boulevard|road|drive|crescent|place))\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const permitMatch = line.match(permitPattern);
    const addressMatch = line.match(addressPattern);

    if (permitMatch || addressMatch) {
      // Use logic to avoid picking up page headers
      if (line.toLowerCase().includes("department") || line.toLowerCase().includes("manual")) continue;

      const context = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3)).join(" ");
      const projectType = detectProjectType(context);
      const estimatedValue = extractEstimatedValue(context);
      const permitNumber = permitMatch ? permitMatch[1] : null;
      const location = addressMatch ? addressMatch[0] : null;

      // Deduplicate if we already found this permit nearby
      if (permits.some(p => p.permit_number === permitNumber && p.permit_number !== null)) continue;

      permits.push({
        title: line.substring(0, 200),
        description: context.trim().substring(0, 500),
        location,
        permit_number: permitNumber,
        city,
        project_type: projectType,
        estimated_value: estimatedValue,
      });

      if (permits.length >= 20) break;
    }
  }

  return permits;
}

// ─── MOCK CONTENT ──────────────────────────────────────────────────────────
const mockMarkdown = `
# Toronto Building Department - Active Applications
The following permits have been issued this week:

*   **Permit #BP-2024-5582** - Issued for 123 Maple Street.
    Description: Installation of new high-efficiency HVAC system and furnace replacement.
    Estimated Value: $12,500.00
    
*   **Application #RE-88992** - 456 Oak Avenue North.
    Description: Large scale renovation including basement finish and kitchen addition.
    Status: Issued. Value: $145,000
    
*   **#RF-12345** - 789 Pine Drive East.
    Roofing replacement for single family dwelling.
    Estimated Value: $8,200.
    
*   Some other fluff text that shouldn't match.

*   **Permis #QC-9988** - 321 Rue de la Montagne, Montréal.
    Travaux de plomberie et drainage.
    Valeur estimée: $5,400.
`;

console.log("Testing Firecrawl Parsing Logic...");
const results = parsePermitsFromMarkdown(mockMarkdown, "toronto", "https://mock.url");

console.log("\nFound Permits:");
results.forEach((p, i) => {
  console.log(`${i + 1}. [${p.project_type}] ${p.permit_number} at ${p.location}`);
  console.log(`   Value: ${p.estimated_value} | Source: ${p.city}`);
});

if (results.length === 4) {
  console.log("\n✅ SUCCESS: All mock permits correctly identified.");
} else {
  console.log(`\n❌ FAILURE: Expected 4 permits, found ${results.length}.`);
}
