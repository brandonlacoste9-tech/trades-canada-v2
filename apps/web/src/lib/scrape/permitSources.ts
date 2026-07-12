/**
 * Canadian municipal permit sources for contractor Lead Radar.
 * Prefer official open-data JSON APIs (free, reliable).
 * Firecrawl is optional for HTML-only portals.
 */

export type ProjectTypeHint =
  | "hvac"
  | "roofing"
  | "landscaping"
  | "renovations"
  | "plumbing"
  | "electrical"
  | "general"
  | "other";

export interface NormalizedPermit {
  title: string;
  description: string | null;
  location: string | null;
  permit_number: string | null;
  source: string;
  url: string;
  city: string;
  project_type: string | null;
  estimated_value: number | null;
}

export interface PermitSource {
  city: string;
  label: string;
  /** Human portal (for Firecrawl fallback / display) */
  portalUrl: string;
  /** Prefer direct JSON open-data when available */
  kind: "socrata" | "opendatasoft" | "ckan_resource" | "firecrawl_only";
  apiUrl?: string;
}

export const PERMIT_SOURCES: PermitSource[] = [
  {
    city: "calgary",
    label: "Calgary Building Permits",
    portalUrl: "https://data.calgary.ca/Business-and-Economic-Activity/Building-Permits/c2es-76ed",
    kind: "socrata",
    apiUrl: "https://data.calgary.ca/resource/c2es-76ed.json?$limit=40&$order=applieddate DESC",
  },
  {
    city: "vancouver",
    label: "Vancouver Issued Building Permits",
    portalUrl: "https://opendata.vancouver.ca/explore/dataset/issued-building-permits/",
    kind: "opendatasoft",
    apiUrl:
      "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/issued-building-permits/records?limit=40&order_by=issue_date%20desc",
  },
  {
    city: "edmonton",
    label: "Edmonton Building Permits",
    portalUrl: "https://data.edmonton.ca/Urban-Planning-Economy/Building-Permits/24uj-dj8v",
    kind: "socrata",
    apiUrl: "https://data.edmonton.ca/resource/24uj-dj8v.json?$limit=40",
  },
  {
    city: "winnipeg",
    label: "Winnipeg Building Permits",
    portalUrl: "https://data.winnipeg.ca/Public-Safety/Building-Permits/9yey-m6xk",
    kind: "socrata",
    apiUrl: "https://data.winnipeg.ca/resource/9yey-m6xk.json?$limit=40",
  },
  {
    city: "toronto",
    label: "Toronto Building Permits — Active",
    portalUrl: "https://open.toronto.ca/dataset/building-permits-active-permits/",
    // Free CKAN DataStore API (~200k+ active permits)
    kind: "ckan_resource",
    apiUrl:
      "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search?resource_id=6d0229af-bc54-46de-9c2b-26759b01dd05&limit=40&sort=APPLICATION_DATE%20desc",
  },
  {
    city: "montreal",
    label: "Montréal Permis de construction",
    portalUrl: "https://donnees.montreal.ca/dataset/permis-construction",
    // Free CKAN DataStore API
    kind: "ckan_resource",
    apiUrl:
      "https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=5232a72d-235a-48eb-ae20-bb9d501300ad&limit=40&sort=date_emission%20desc",
  },
  {
    city: "ottawa",
    label: "Ottawa Building Permits (portal)",
    portalUrl: "https://open.ottawa.ca/datasets/ottawa::building-permits-2024/explore",
    // Still HTML/ArcGIS-heavy — Firecrawl fallback until FeatureServer is pinned
    kind: "firecrawl_only",
  },
  {
    city: "quebec",
    label: "Québec Permis (portal)",
    portalUrl: "https://donnees.ville.quebec.qc.ca/dataset/permis-de-construction",
    kind: "firecrawl_only",
  },
];

export function detectProjectType(text: string): ProjectTypeHint | null {
  const lower = text.toLowerCase();
  if (/hvac|heating|cooling|furnace|cvac|climatisation/.test(lower)) return "hvac";
  if (/roof|shingle|toiture/.test(lower)) return "roofing";
  if (/plumb|plomberie|drain/.test(lower)) return "plumbing";
  if (/electric|électr|wiring/.test(lower)) return "electrical";
  if (/landscape|paysag/.test(lower)) return "landscaping";
  if (/renovat|rénovation|addition|alteration/.test(lower)) return "renovations";
  if (/new build|construction|foundation|new house/.test(lower)) return "general";
  return null;
}

export function extractEstimatedValue(text: string): number | null {
  const matches = text.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (!matches) return null;
  const values = matches.map((m) => parseFloat(m.replace(/[$,]/g, "")));
  return Math.max(...values.filter((n) => !Number.isNaN(n))) || null;
}

function pick(obj: Record<string, unknown>, keys: string[]): string | null {
  const lowerMap = new Map(
    Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])
  );
  for (const k of keys) {
    const v = obj[k] ?? lowerMap.get(k.toLowerCase());
    if (v != null && String(v).trim() && String(v).trim() !== "null") {
      return String(v).trim();
    }
  }
  return null;
}

function num(obj: Record<string, unknown>, keys: string[]): number | null {
  const lowerMap = new Map(
    Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v])
  );
  for (const k of keys) {
    const v = obj[k] ?? lowerMap.get(k.toLowerCase());
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = parseFloat(v.replace(/[$,]/g, ""));
      if (!Number.isNaN(n) && n > 0 && n < 1e10) return n;
    }
  }
  return null;
}

/** Build street address from Toronto-style split fields */
function torontoAddress(row: Record<string, unknown>): string | null {
  const num = pick(row, ["STREET_NUM", "street_num"]);
  const name = pick(row, ["STREET_NAME", "street_name"]);
  const type = pick(row, ["STREET_TYPE", "street_type"]);
  const dir = pick(row, ["STREET_DIRECTION", "street_direction"]);
  if (!num && !name) return null;
  return [num, name, type, dir].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/** Map heterogeneous open-data rows → NormalizedPermit */
export function normalizeOpenDataRow(
  row: Record<string, unknown>,
  source: PermitSource
): NormalizedPermit | null {
  const permitNumber = pick(row, [
    "PERMIT_NUM",
    "permitnum",
    "permit_number",
    "permitno",
    "permit_no",
    "buildingpermit",
    "permitid",
    "permit_id",
    "id_permis",
    "no_demande",
    "folderyear",
    "id",
  ]);

  let address =
    pick(row, [
      "originaladdress",
      "address",
      "streetaddress",
      "street_address",
      "location",
      "site_address",
      "propertyaddress",
      "civic_address",
      "emplacement",
    ]) || torontoAddress(row);

  // Append arrondissement for Montréal context
  const arrond = pick(row, ["arrondissement"]);
  if (address && arrond && source.city === "montreal") {
    address = `${address}, ${arrond}`;
  }

  const description = pick(row, [
    "DESCRIPTION",
    "description",
    "nature_travaux",
    "workdescription",
    "work_description",
    "WORK",
    "permittypedesc",
    "description_type_demande",
    "description_type_batiment",
    "permittype",
    "PERMIT_TYPE",
    "type",
    "statuscurrent",
    "STATUS",
    "status",
  ]);

  const title =
    pick(row, [
      "PERMIT_TYPE",
      "permittype",
      "permittypedesc",
      "description_type_demande",
      "nature_travaux",
      "WORK",
      "type",
      "worktype",
      "DESCRIPTION",
      "description",
    ]) || `${source.label} permit`;

  const value = num(row, [
    "EST_CONST_COST",
    "estprojectcost",
    "estimated_value",
    "estimatedvalue",
    "constructionvalue",
    "value",
    "projectvalue",
  ]);

  const blob = `${title} ${description ?? ""} ${address ?? ""}`;
  const projectType = detectProjectType(blob);

  if (!address && !permitNumber && !description) return null;

  return {
    title: title.substring(0, 200),
    description: (description ?? blob).substring(0, 500),
    location: address,
    permit_number: permitNumber ? String(permitNumber).substring(0, 80) : null,
    source: source.label,
    url: source.portalUrl,
    city: source.city,
    project_type: projectType,
    estimated_value: value,
  };
}

export function parsePermitsFromMarkdown(
  markdown: string,
  city: string,
  sourceUrl: string,
  label: string
): NormalizedPermit[] {
  const permits: NormalizedPermit[] = [];
  const lines = markdown
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 5);

  const permitPattern = /(?:permit|permis|application|#)\s*[:#\s]*([A-Z0-9-]{4,})/i;
  const addressPattern =
    /\b(\d+)\s+([A-Z0-9\s.]+ (?:st|ave|blvd|rd|dr|way|cres|pl|court|lane|street|avenue|boulevard|road|drive|crescent|place))\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const permitMatch = line.match(permitPattern);
    const addressMatch = line.match(addressPattern);
    if (!permitMatch && !addressMatch) continue;
    if (/department|manual|cookie|privacy/i.test(line)) continue;

    const context = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3)).join(" ");
    const permitNumber = permitMatch ? permitMatch[1] : null;
    if (permitNumber && permits.some((p) => p.permit_number === permitNumber)) continue;

    permits.push({
      title: line.substring(0, 200),
      description: context.trim().substring(0, 500),
      location: addressMatch ? addressMatch[0] : null,
      permit_number: permitNumber,
      source: label,
      url: sourceUrl,
      city,
      project_type: detectProjectType(context),
      estimated_value: extractEstimatedValue(context),
    });

    if (permits.length >= 25) break;
  }

  return permits;
}
