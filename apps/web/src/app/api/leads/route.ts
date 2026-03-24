import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ProjectType } from "@/types/database";
import { qualifyLead } from "@/lib/ai/leadQualification";

// ─── /api/leads — Public lead submission endpoint ─────────────────────────────
// Uses the Supabase SERVICE ROLE key so the insert always succeeds regardless
// of RLS policies on the `leads` table. This is the correct pattern for
// unauthenticated public forms — never expose the service role key client-side.
//
const PROJECT_TYPE_VALUES = [
  "hvac",
  "roofing",
  "landscaping",
  "renovations",
  "plumbing",
  "electrical",
  "general",
  "other",
] as const satisfies readonly ProjectType[];

// Map legacy form values → actual DB enum values
const LEGACY_MAP: Record<string, string> = {
  general_contractor: "general",
  new_construction: "general",
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const MIN_FORM_FILL_MS = 1200;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const LOG_PREFIX = "[api/leads]";

const LeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).nullable().optional(),
  // Accept both current form values and legacy aliases.
  project_type: z.string().min(1),
  city: z.string().max(100).nullable().optional(),
  language: z.enum(["en", "fr"]).optional(),
  website: z.string().max(200).optional(),
  form_rendered_at: z.number().int().positive().optional(),
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

function mapProjectType(raw: string): ProjectType {
  const normalized = raw.toLowerCase().trim();
  const mapped = LEGACY_MAP[normalized] ?? normalized;
  if ((PROJECT_TYPE_VALUES as readonly string[]).includes(mapped)) {
    return mapped as ProjectType;
  }
  return "other";
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function shouldRateLimit(ip: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  rateLimitStore.set(ip, existing);
  return false;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `**@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  // ── Parse & validate ───────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.warn(`${LOG_PREFIX} invalid_json`, { requestId });
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    console.warn(`${LOG_PREFIX} validation_failed`, {
      requestId,
      issues: parsed.error.issues.length,
    });
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const ip = getClientIp(req);
  if (shouldRateLimit(ip)) {
    console.warn(`${LOG_PREFIX} rate_limited`, { requestId, ip });
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const honeypotValue = parsed.data.website?.trim() ?? "";
  if (honeypotValue.length > 0) {
    console.warn(`${LOG_PREFIX} honeypot_triggered`, { requestId, ip });
    // Return success to avoid teaching bots which validation failed.
    return NextResponse.json({ success: true }, { status: 201 });
  }

  if (parsed.data.form_rendered_at) {
    const formAgeMs = Date.now() - parsed.data.form_rendered_at;
    if (formAgeMs < MIN_FORM_FILL_MS) {
      console.warn(`${LOG_PREFIX} fill_time_rejected`, { requestId, ip, formAgeMs });
      return NextResponse.json({ success: true }, { status: 201 });
    }
  }

  const projectType = mapProjectType(parsed.data.project_type);

  // ── Insert via service role (bypasses RLS) ─────────────────────────────────
  try {
    const supabase = getServiceClient();
    const { data: insertedLead, error: dbError } = await supabase
      .from("leads")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        project_type: projectType,
        language: parsed.data.language ?? "en",
        city: parsed.data.city ?? null,
        source: "web",
      })
      .select("id")
      .single();

    if (dbError) {
      console.error(`${LOG_PREFIX} db_insert_failed`, {
        requestId,
        ip,
        code: dbError.code,
        message: dbError.message,
      });
      return NextResponse.json(
        { error: dbError.message, code: "DB_INSERT_FAILED" },
        { status: 500 }
      );
    }

    // Qualification + logs must not fail the HTTP response after a successful insert.
    let qualification: Awaited<ReturnType<typeof qualifyLead>> | null = null;
    try {
      qualification = await qualifyLead({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        city: parsed.data.city ?? null,
        projectType,
        language: parsed.data.language ?? "en",
      });

      if (insertedLead?.id && qualification) {
        const { error: updateErr } = await supabase
          .from("leads")
          .update({
            score: qualification.score,
            message: qualification.summary,
            updated_at: new Date().toISOString(),
          })
          .eq("id", insertedLead.id);

        if (updateErr) {
          console.error(`${LOG_PREFIX} lead_update_failed`, { requestId, message: updateErr.message });
        }

        const { error: logErr } = await supabase.from("automated_logs").insert({
          event_type: "lead.ai_qualified",
          channel: "ai",
          status: "sent",
          subject: `Lead qualified (${qualification.provider})`,
          lead_id: insertedLead.id,
          metadata: {
            score: qualification.score,
            next_action: qualification.nextAction,
            provider: qualification.provider,
          },
        });

        if (logErr) {
          console.error(`${LOG_PREFIX} automated_log_failed`, { requestId, message: logErr.message });
        }
      }
    } catch (sideEffectErr: unknown) {
      const msg = sideEffectErr instanceof Error ? sideEffectErr.message : String(sideEffectErr);
      console.error(`${LOG_PREFIX} post_insert_failed`, { requestId, message: msg });
    }

    console.info(`${LOG_PREFIX} lead_created`, {
      requestId,
      ip,
      email: maskEmail(parsed.data.email),
      projectType,
      city: parsed.data.city ?? null,
      language: parsed.data.language ?? "en",
      aiProvider: qualification?.provider,
      aiScore: qualification?.score,
      aiNextAction: qualification?.nextAction,
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error.";
    const code =
      /credentials not configured|service role credentials/i.test(msg)
        ? "MISSING_SERVICE_ROLE"
        : "UNEXPECTED";
    console.error(`${LOG_PREFIX} unexpected_error`, { requestId, ip, message: msg, code });
    return NextResponse.json({ error: msg, code }, { status: 500 });
  }
}
