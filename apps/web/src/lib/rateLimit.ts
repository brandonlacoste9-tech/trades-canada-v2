import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Supabase-backed rate limiter that works across serverless invocations.
 * Uses a `rate_limits` table with atomic upsert + count check.
 */
export async function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ limited: boolean; remaining: number }> {
  const supabase = getServiceClient();
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  // Clean expired entry for this key, then upsert
  const { data, error } = await supabase.rpc("check_rate_limit", {
    rate_key: key,
    window_ms: windowMs,
    max_requests: maxRequests,
  });

  if (error) {
    // If rate limit check fails, allow the request (fail open)
    console.error("[rateLimit] check failed, allowing request:", error.message);
    return { limited: false, remaining: maxRequests };
  }

  return {
    limited: data?.limited ?? false,
    remaining: data?.remaining ?? maxRequests,
  };
}
