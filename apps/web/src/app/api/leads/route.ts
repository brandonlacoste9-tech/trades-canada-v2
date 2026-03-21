import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database";

// ─── /api/leads — Public lead submission endpoint ─────────────────────────────
// Uses the Supabase SERVICE ROLE key so the insert always succeeds regardless
// of RLS policies on the `leads` table. This is the correct pattern for
// unauthenticated public forms — never expose the service role key client-side.

const LeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).nullable().optional(),
  project_type: z.enum([
    "renovations",
    "general",
    "plumbing",
    "electrical",
    "roofing",
    "hvac",
    "landscaping",
    "other",
  ]),
  language: z.enum(["en", "fr"]).default("en"),
  source: z.string().default("web"),
  status: z.string().default("new"),
  city: z.string().max(100).nullable().optional(),
});

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured.");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
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

  // ── Insert via service role (bypasses RLS) ─────────────────────────────────
  try {
    const supabase = getServiceClient();
    // Only insert columns that actually exist in the live Supabase table.
    // language / source / status may be in the TS types but absent from the DB.
    const insertPayload: Record<string, unknown> = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      project_type: parsed.data.project_type,
      city: parsed.data.city ?? null,
    };

    const { error: dbError } = await supabase.from("leads").insert(insertPayload as never);

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
