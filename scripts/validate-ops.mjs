#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_WEB_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const REQUIRED_SUPABASE_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const repoRoot = process.cwd();
const webEnvPath = resolve(repoRoot, "apps/web/.env.local");
const supabaseEnvPath = resolve(repoRoot, "supabase/.env");

const missing = [];
const warnings = [];

const parseEnvFile = (path) => {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  const out = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) continue;
    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();
    out[key] = value;
  }
  return out;
};

const webFileEnv = parseEnvFile(webEnvPath);
const supabaseFileEnv = parseEnvFile(supabaseEnvPath);

const hasValue = (key, fileEnv) => {
  const runtime = process.env[key];
  if (typeof runtime === "string" && runtime.trim().length > 0) return true;
  const local = fileEnv[key];
  return typeof local === "string" && local.trim().length > 0;
};

for (const key of REQUIRED_WEB_ENV) {
  if (!hasValue(key, webFileEnv)) missing.push(`web:${key}`);
}

for (const key of REQUIRED_SUPABASE_ENV) {
  if (!hasValue(key, supabaseFileEnv)) missing.push(`supabase:${key}`);
}

const legacyToggle = process.env.SUPABASE_ENABLE_LEGACY_STRIPE_WEBHOOK ?? supabaseFileEnv.SUPABASE_ENABLE_LEGACY_STRIPE_WEBHOOK;
if (legacyToggle && legacyToggle.toLowerCase() === "true") {
  warnings.push("SUPABASE_ENABLE_LEGACY_STRIPE_WEBHOOK=true (expected false except emergency fallback)");
}

if (!existsSync(webEnvPath)) {
  warnings.push("apps/web/.env.local is missing (runtime env may still be provided by Vercel)");
}

if (!existsSync(supabaseEnvPath)) {
  warnings.push("supabase/.env is missing (runtime env may still be provided by Supabase secrets)");
}

console.log("Ops validation report");
console.log("=====================");
console.log(`- repo: ${repoRoot}`);
console.log(`- web env source: ${existsSync(webEnvPath) ? webEnvPath : "not found"}`);
console.log(`- supabase env source: ${existsSync(supabaseEnvPath) ? supabaseEnvPath : "not found"}`);

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (missing.length > 0) {
  console.error("\nMissing required keys:");
  for (const key of missing) console.error(`- ${key}`);
  process.exit(1);
}

console.log("\nAll required ops keys are present.");
