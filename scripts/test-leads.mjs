/**
 * Smoke-test homeowner lead generation → POST /api/leads
 *
 * Usage:
 *   node scripts/test-leads.mjs
 *   AI_TEST_BASE=http://localhost:3002 node scripts/test-leads.mjs
 *   AI_TEST_BASE=https://www.trades-canada.com node scripts/test-leads.mjs
 */

const BASE = process.env.AI_TEST_BASE || process.env.BASE_URL || "http://localhost:3002";

let passed = 0;
let failed = 0;

function assert(cond, label, detail) {
  if (cond) {
    console.log(`✅ PASS: ${label}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${label}`);
    if (detail !== undefined) {
      console.log(typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
    }
    failed++;
  }
}

async function postLead(body) {
  const res = await fetch(`${BASE}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    /* empty */
  }
  return { status: res.status, json };
}

function aged(msAgo = 5000) {
  return Date.now() - msAgo;
}

async function main() {
  console.log(`\n📋 Lead generation smoke test`);
  console.log(`   BASE=${BASE}\n`);

  // 1. Invalid payload
  {
    const r = await postLead({ name: "", email: "not-an-email", project_type: "hvac" });
    assert(r.status === 422, "invalid fields → 422", r);
  }

  // 2. Honeypot (should look like success, not insert)
  {
    const r = await postLead({
      name: "Bot",
      email: "bot@spam.test",
      project_type: "hvac",
      website: "https://spam.example",
      form_rendered_at: aged(),
    });
    assert(r.status === 201 && r.json.success === true, "honeypot → fake 201 success", r);
  }

  // 3. Too-fast fill (anti-bot) → fake success
  {
    const r = await postLead({
      name: "Speedy",
      email: "fast@example.com",
      project_type: "plumbing",
      form_rendered_at: Date.now(), // just now
    });
    assert(r.status === 201 && r.json.success === true, "too-fast fill → fake 201", r);
  }

  // 4. Real lead EN
  {
    const stamp = Date.now();
    const r = await postLead({
      name: "Smoke Test Homeowner",
      email: `smoke.en.${stamp}@example.com`,
      phone: "4165550100",
      project_type: "plumbing",
      language: "en",
      city: "Toronto",
      form_rendered_at: aged(5000),
    });
    if (r.status === 201 && r.json.success) {
      assert(true, "valid EN lead → 201 success (persisted or pipeline ok)");
    } else if (r.json?.code === "MISSING_SERVICE_ROLE" || r.json?.code === "ANON_KEY_AS_SERVICE_ROLE") {
      assert(false, "valid EN lead needs real SUPABASE_SERVICE_ROLE_KEY", r);
    } else if (r.json?.code === "DB_INSERT_FAILED") {
      assert(
        false,
        "valid EN lead → DB insert failed (check NEXT_PUBLIC_SUPABASE_URL + service role + leads table)",
        r
      );
    } else {
      assert(false, "valid EN lead → unexpected response", r);
    }
  }

  // 5. Real lead FR
  {
    const stamp = Date.now();
    const r = await postLead({
      name: "Test Propriétaire",
      email: `smoke.fr.${stamp}@example.com`,
      project_type: "roofing",
      language: "fr",
      city: "Montreal",
      form_rendered_at: aged(5000),
    });
    if (r.status === 201 && r.json.success) {
      assert(true, "valid FR lead → 201 success");
    } else if (r.json?.code === "DB_INSERT_FAILED" || r.json?.code === "MISSING_SERVICE_ROLE") {
      assert(false, "valid FR lead → DB/config failure", r);
    } else {
      assert(false, "valid FR lead → unexpected", r);
    }
  }

  // 6. Invalid project type still accepted (mapped to other)
  {
    const r = await postLead({
      name: "Other Trade",
      email: `smoke.other.${Date.now()}@example.com`,
      project_type: "window_cleaning",
      form_rendered_at: aged(),
    });
    // Should either succeed (mapped to other) or fail same config way
    if (r.status === 201) {
      assert(true, "unknown project_type maps/accepts → 201");
    } else if (r.json?.code === "DB_INSERT_FAILED" || r.json?.code === "MISSING_SERVICE_ROLE") {
      assert(false, "unknown project_type blocked by config (same as valid lead)", r);
    } else {
      assert(false, "unknown project_type unexpected", r);
    }
  }

  console.log(`\n────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log(`
Next steps if DB_INSERT_FAILED / MISSING_SERVICE_ROLE:
  1. Open Supabase → Project Settings → API
  2. Put into apps/web/.env.local:
       NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
       NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon public)
       SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role secret — NOT anon)
  3. Apply schema: supabase db push  OR run supabase/schema.sql
  4. Restart: pnpm dev:web
  5. Re-run: node scripts/test-leads.mjs
`);
  }
  console.log(failed === 0 ? "✅ LEAD GEN SMOKE PASSED\n" : "❌ LEAD GEN NOT FULLY WORKING\n");
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
