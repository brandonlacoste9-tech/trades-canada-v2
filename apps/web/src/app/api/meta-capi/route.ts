import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ─── Meta CAPI — Server-Side Event Relay ─────────────────────────────────────
// Sends conversion events directly from the server to Meta's Conversions API.
// This bypasses ad blockers and iOS 14+ privacy restrictions, giving you
// accurate attribution for both homeowner leads and contractor subscriptions.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = "v19.0";

function hashSHA256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function POST(req: NextRequest) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return NextResponse.json({ error: "Meta CAPI not configured" }, { status: 503 });
  }

  const body = await req.json();
  const {
    event_name,   // e.g. "Lead", "CompleteRegistration", "Purchase"
    email,        // user email (will be hashed)
    phone,        // user phone (will be hashed, optional)
    city,         // city slug for geo targeting
    value,        // monetary value (for Purchase/Subscribe events)
    currency,     // "CAD" for Canada
    event_id,     // deduplication ID (match client-side fbq event_id)
  } = body;

  // Build user data with hashed PII
  const user_data: Record<string, string> = {
    client_ip_address: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "",
    client_user_agent: req.headers.get("user-agent") ?? "",
  };
  if (email) user_data.em = hashSHA256(email);
  if (phone) user_data.ph = hashSHA256(phone.replace(/\D/g, ""));

  // Build custom data
  const custom_data: Record<string, string | number> = {
    currency: currency ?? "CAD",
  };
  if (city) custom_data.content_name = city;
  if (value) custom_data.value = value;

  const payload = {
    data: [
      {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event_id ?? crypto.randomUUID(),
        event_source_url: req.headers.get("referer") ?? `https://trades-canada.com`,
        action_source: "website",
        user_data,
        custom_data,
      },
    ],
    test_event_code: process.env.META_CAPI_TEST_CODE ?? undefined,
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[meta-capi] Error:", err);
    return NextResponse.json({ error: "CAPI request failed" }, { status: 500 });
  }
}
