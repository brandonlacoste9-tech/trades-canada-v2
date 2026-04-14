import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isValidLang } from "@/lib/i18n";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API routes: skip auth + session refresh ───────────────────────────────
  // Lead intake and other handlers use their own credentials; running the
  // Supabase browser client + getUser() on every POST adds latency and can
  // fail the whole request if the anon key/network path misbehaves at the edge.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // ─── i18n redirect: / → /en or /fr (Quebec Priority) ──
  if (pathname === "/") {
    const acceptLang = request.headers.get("accept-language") ?? "";
    const qcRegion = request.headers.get("x-vercel-ip-country-region") === "QC";
    
    let preferred = acceptLang.split(",")[0]?.split("-")[0]?.toLowerCase();
    
    // Bill 96 / Quebec Sovereignty Rule: Prioritize French if in QC
    if (qcRegion && !preferred?.includes("fr")) {
       preferred = "fr";
    }
    
    const lang = isValidLang(preferred ?? "") ? preferred : defaultLocale;
    return NextResponse.redirect(new URL(`/${lang}`, request.url));
  }

  // ── Validate locale prefix ──
  const segments = pathname.split("/");
  const potentialLang = segments[1];
  if (potentialLang && !isValidLang(potentialLang) && !pathname.startsWith("/_next") && !pathname.startsWith("/api") && !pathname.includes(".")) {
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
  }

  // ── Supabase auth session refresh ──
  let supabaseResponse = NextResponse.next({ request });
  let user = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("Middleware Supabase initialization error:", error);
    // Graceful fallback to unauthenticated state rather than crashing the Edge Function
  }


  // ── Protect dashboard and settings routes ──
  const lang = isValidLang(potentialLang ?? "") ? potentialLang : defaultLocale;
  const protectedPaths = [`/${lang}/dashboard`, `/${lang}/settings`, `/${lang}/admin`];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL(`/${lang}/auth`, request.url));
  }

  // ── Redirect authenticated users away from auth page ──
  // Exception: allow /auth?plan=price_... so pricing CTAs can open Stripe Checkout
  // (otherwise the redirect to dashboard drops the plan and users stay on "free" tier).
  if (pathname === `/${lang}/auth` && user) {
    const plan = request.nextUrl.searchParams.get("plan");
    if (!plan || !plan.startsWith("price_")) {
      return NextResponse.redirect(new URL(`/${lang}/dashboard`, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
