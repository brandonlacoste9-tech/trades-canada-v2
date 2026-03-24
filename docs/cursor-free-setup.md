# Cursor Free Setup (Trades-Canada)

This setup keeps your team productive without paid add-ons.

## 1) Use local scripts as your default loop

- Start app: `pnpm dev:web`
- Fast quality check: `pnpm check:web`
- Full monorepo check: `pnpm check`

## 2) Free-first autonomous behavior already in this repo

- Lead intake anti-spam is active (`/api/leads`).
- AI lead qualification has fallback mode:
  - Uses OpenAI if `OPENAI_API_KEY` exists.
  - Uses deterministic heuristic scoring if not configured.
- Stripe webhook handling is deterministic with dedupe.

## 3) Optional env vars (can be blank for free mode)

- `OPENAI_API_KEY` (optional)
  - If omitted, system uses heuristic qualification.

## 4) Recommended day-to-day in Cursor

- Work in Agent mode for implementation.
- Use `/api` route handlers for server-side enforcement of sensitive actions.
- Validate with `pnpm check:web` before shipping.

## 5) If you later enable MCPs

Most useful for this project:

- Supabase MCP: inspect lead/log tables and routing outcomes.
- Stripe MCP: confirm webhook deliveries and product/price mappings.

If MCP auth is skipped, local scripts and dashboard ops pages still provide a strong baseline.
