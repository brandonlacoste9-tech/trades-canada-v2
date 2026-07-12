/**
 * Smoke-test municipal lead scrape → contractor marketplace leads
 *
 * 1) Hits open-data APIs (no Firecrawl required for Calgary/etc.)
 * 2) Optionally hits POST /api/radar/scrape with CRON_SECRET
 *
 * Usage:
 *   node scripts/test-scrape.mjs
 *   AI_TEST_BASE=http://localhost:3002 CRON_SECRET=dev-scrape-secret-local node scripts/test-scrape.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.AI_TEST_BASE || "http://localhost:3002";
const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, "apps/web/.env.local");

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = loadEnv();
const CRON = process.env.CRON_SECRET || env.CRON_SECRET || "";

async function testOpenData() {
  console.log("\n=== Open-data API (Calgary) ===");
  const res = await fetch(
    "https://data.calgary.ca/resource/c2es-76ed.json?$limit=5&$order=applieddate DESC"
  );
  if (!res.ok) {
    console.log("❌ Calgary API", res.status);
    return false;
  }
  const rows = await res.json();
  console.log(`✅ Calgary returned ${rows.length} permits`);
  console.log("   sample:", rows[0]?.permitnum, rows[0]?.permittype, rows[0]?.originaladdress);
  return rows.length > 0;
}

async function testApiScrape() {
  console.log("\n=== POST /api/radar/scrape ===");
  if (!CRON) {
    console.log("⚠️  No CRON_SECRET — skipping authenticated scrape route test");
    return null;
  }
  const res = await fetch(`${BASE}/api/radar/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CRON}`,
    },
    body: JSON.stringify({
      cities: ["calgary", "vancouver", "edmonton"],
      promoteToLeads: true,
      maxPerCity: 8,
    }),
  });
  const json = await res.json().catch(() => ({}));
  console.log("status", res.status, JSON.stringify(json, null, 2));
  if (res.ok && (json.promotedToLeads > 0 || json.inserted > 0 || json.skipped >= 0)) {
    console.log("✅ Scrape route responded successfully");
    return true;
  }
  console.log("❌ Scrape route failed or empty");
  return false;
}

async function testStatus() {
  console.log("\n=== GET /api/radar/scrape status ===");
  const res = await fetch(`${BASE}/api/radar/scrape`);
  const json = await res.json().catch(() => ({}));
  console.log(JSON.stringify(json, null, 2));
  return res.ok;
}

async function main() {
  console.log(`Scrape smoke · BASE=${BASE}`);
  const a = await testOpenData();
  const b = await testStatus();
  const c = await testApiScrape();
  console.log("\n────────────────────────────────");
  if (a && b && c !== false) {
    console.log("✅ SCRAPE PIPELINE LOOKS GOOD");
    if (c === null) console.log("   (set CRON_SECRET + restart server for full route test)");
    process.exit(0);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
