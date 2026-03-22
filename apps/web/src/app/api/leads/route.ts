import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ─── /api/leads — Public lead submission endpoint ─────────────────────────────
// Uses the Supabase SERVICE ROLE key so the insert always succeeds regardless
// of RLS policies on the `leads` table. This is the correct pattern for
// unauthenticated public forms — never expose the service role key client-side.
//
// Actual `leads` table schema (from information_schema.columns):
//   id, first_name, last_name, email, phone, city, province, postal_code,
//   trade_category (enum), project_description, estimated_budget, status (USER-DEFINED),
//   claimed_by, claimed_at, source, ip_address, created_at, updated_at
//
// trade_category enum values:
//   roofing | plumbing | electrical | hvac | general_contractor | flooring |
//   painting | landscaping | masonry | windows_doors | insulation | drywall |
//   excavation | concrete | other

const TRADE_CATEGORY_VALUES = [
  "roofing",
  "plumbing",
  "electrical",
  "hvac",
  "general_contractor",
  "flooring",
  "painting",
  "landscaping",
  "masonry",
  "windows_doors",
  "insulation",
  "drywall",
  "excavation",
  "concrete",
  "other",
] as const;

// Map legacy form values → actual DB enum values
const LEGACY_MAP: Record<string, string> = {
  renovations: "general_contractor",
  general: "general_contractor",
  "new_construction": "general_contractor",
};

const LeadSchema = z.object({
  // The form sends a single "name" field — we split it into first/last
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).nullable().optional(),
  // Accept both old form values and new DB enum values
  project_type: z.string().min(1),
  city: z.string().max(100).nullable().optional(),
  language: z.string().optional(),
});

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function splitName(fullName: string): { first_name: string; last_name: string | null } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: null };
  const last = parts.pop()!;
  return { first_name: parts.join(" "), last_name: last };
}

function mapTradeCategory(raw: string): string {
  const normalized = raw.toLowerCase().trim();
  // Check legacy map first
  if (LEGACY_MAP[normalized]) return LEGACY_MAP[normalized];
  // Check if it's already a valid enum value
  if ((TRADE_CATEGORY_VALUES as readonly string[]).includes(normalized)) return normalized;
  // Default fallback
  return "other";
}

export async function POST(req: NextRequest) {
  // ── Parse & validate ───────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { first_name, last_name } = splitName(parsed.data.name);
  const trade_category = mapTradeCategory(parsed.data.project_type);

  // ── Insert via service role (bypasses RLS) ─────────────────────────────────
  try {
    const supabase = getServiceClient();
    const { error: dbError } = await supabase.from("leads").insert({
      first_name,
      last_name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      trade_category,
      city: parsed.data.city ?? null,
      source: "web",
    });

    if (dbError) {
      console.error("[api/leads] Supabase insert error:", dbError.message, dbError.code);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error.";
    console.error("[api/leads] Unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
