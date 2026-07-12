import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@/types/database";

import DashboardStats from "@/components/dashboard/DashboardStats";
import LeadMarketplace from "@/components/marketplace/LeadMarketplace";
import SubscriptionSyncBanner from "@/components/dashboard/SubscriptionSyncBanner";
import { evaluateLeadEligibility, normalizeTier, type ContractorTier } from "@/lib/leadEligibility";
import { syncUserSubscriptionFromStripe } from "@/lib/stripe-subscription-sync";
import { getMockLeads } from "@/lib/mockLeads";

interface DashboardPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export const metadata: Metadata = {
  title: "Dashboard | Trades-Canada",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({ params, searchParams }: DashboardPageProps) {
  const { lang } = await params;
  const { success } = await searchParams;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  // When redirected back from Stripe checkout, proactively sync the
  // subscription tier from Stripe before rendering — fixes the race
  // condition where the webhook hasn't fired yet.
  const justPaid = success === "1";
  if (
    justPaid &&
    process.env.STRIPE_SECRET_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    try {
      const supabaseCheck = await createClient();
      const {
        data: { user: checkUser },
      } = await supabaseCheck.auth.getUser();
      if (checkUser) {
        await syncUserSubscriptionFromStripe(checkUser.id, checkUser.email);
      }
    } catch (syncErr) {
      console.warn(
        "[dashboard] post-checkout sync failed:",
        syncErr instanceof Error ? syncErr.message : syncErr
      );
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/auth`);

  type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
  type LogRow = Database["public"]["Tables"]["automated_logs"]["Row"];
  type PermitRow = Database["public"]["Tables"]["scraped_inventory"]["Row"];

  // ── Fetch profile & determine tier ─────────────────────────────────────
  const { data: profileData } = await supabase
    .from("profiles")
    .select("subscription_tier, city, services")
    .eq("id", user.id)
    .single();

  const rawTier = (profileData as { subscription_tier?: string | null } | null)?.subscription_tier;
  const testAccess = user?.email === "brandonlacoste9@gmail.com";
  const tier: ContractorTier = (rawTier ? normalizeTier(rawTier) : "starter") as ContractorTier;
  const isFree = (!rawTier || rawTier === "" || rawTier === "free") && !testAccess;
  const isPaid = !isFree; // starter, engine/pro, dominator/elite
  const isElite = tier === "elite" || testAccess;
  const canSeeMunicipalData = isPaid;
  const canSeeAllData = isElite;

  // ── TIER-GATED DATA FETCHING ───────────────────────────────────────────
  let myLeads: LeadRow[] = [];
  let marketLeads: LeadRow[] = [];
  let permits: PermitRow[] = [];
  let logs: LogRow[] = [];
  let unlockedLeadIds = new Set<string>();

  if (isPaid) {
    // ── Real leads (Starter, Pro, Elite) ──────────────────────────────
    // Always flat-select leads — lead_contacts table may not exist in production.
    const flat = await supabase
      .from("leads")
      .select("*")
      .or(`contractor_id.eq.${user.id},contractor_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(80);
    if (flat.error) {
      console.error("[dashboard] leads fetch failed", flat.error.message);
    }
    const leads = (flat.data as LeadRow[] | null) ?? null;

    myLeads = leads?.filter((l) => l.contractor_id === user.id) ?? [];
    const marketLeadsRaw = leads?.filter((lead) => lead.contractor_id === null) ?? [];
    marketLeads = profileData
      ? marketLeadsRaw.filter((lead) => evaluateLeadEligibility(lead, profileData).eligible)
      : marketLeadsRaw;

    // ── Tier 2+: municipal permit intelligence ────────────────────────
    if (canSeeMunicipalData) {
      // Prefer live column set (address/source_url). Avoid columns that may not exist.
      const { data: permitsData, error: permitsErr } = await supabase
        .from("scraped_inventory")
        .select(
          "id, title, description, address, permit_number, source, source_url, city, province, project_type, estimated_value, scraped_at, applicant_name"
        )
        .order("scraped_at", { ascending: false })
        .limit(40);
      if (permitsErr) {
        console.error("[dashboard] permits fetch failed", permitsErr.message);
        // Fallback minimal select
        const fallback = await supabase
          .from("scraped_inventory")
          .select("id, title, description, city, scraped_at, project_type")
          .order("scraped_at", { ascending: false })
          .limit(40);
        permits = (fallback.data ?? []) as PermitRow[];
      } else {
        permits = (permitsData ?? []) as PermitRow[];
      }
    }

    // ── Unlocks ──
    const { data: unlocksRaw } = await supabase
      .from("lead_unlocks")
      .select("lead_id")
      .eq("contractor_id", user.id);
    unlockedLeadIds = new Set(
      ((unlocksRaw ?? []) as { lead_id: string }[]).map((u) => u.lead_id)
    );

    // ── Automation logs ──
    const { data: logsData } = await supabase
      .from("automated_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    logs = (logsData as LogRow[] | null) ?? [];
  }

  // ── Build lead list for marketplace ────────────────────────────────────
  type LeadData = {
    id: string;
    title: string;
    source: string;
    location: string;
    projectType: string;
    value: string;
    description: string;
    createdAt: string;
    isUnlocked: boolean;
    isMock?: boolean;
    status?: string;
    name?: string;
    email?: string;
    phone?: string;
    url?: string;
    leadKind?: "form" | "permit" | "demo";
    permitNumber?: string | null;
    address?: string | null;
  };

  /** Pull street address / permit # out of scrape messages for better cards */
  function parseIntel(message: string | null | undefined) {
    const text = message || "";
    const loc = text.match(/Location:\s*(.+)/i)?.[1]?.trim();
    const permit = text.match(/Permit\s*#:\s*(.+)/i)?.[1]?.trim();
    const firstLine = text.split("\n").map((s) => s.trim()).find(Boolean) || "";
    return { loc, permit, firstLine, full: text };
  }

  function isSyntheticEmail(email: string | null | undefined) {
    return !email || email.includes("@scraped.trades-canada.local");
  }

  function prettyProjectType(pt: string) {
    return pt ? pt.charAt(0).toUpperCase() + pt.slice(1) : "General";
  }

  let displayLeads: LeadData[];

  if (isFree) {
    displayLeads = getMockLeads(l);
  } else {
    // Form + scraped marketplace leads (public.leads)
    const allDataLeads: LeadData[] = [
      ...myLeads.map((le) => {
        const contact = (le as {
          lead_contacts?: { name: string; email: string; phone: string | null };
        }).lead_contacts;
        const name = contact?.name || (le as { name?: string }).name || "N/A";
        const email = contact?.email || (le as { email?: string }).email || undefined;
        const phone =
          (contact?.phone || (le as { phone?: string | null }).phone) ?? undefined;
        const intel = parseIntel(le.message);
        const isScraped = le.source === "scraped";
        const title = isScraped
          ? `${prettyProjectType(le.project_type)}${intel.permit ? ` · #${intel.permit}` : ""}`
          : name !== "N/A"
            ? `${name} — ${prettyProjectType(le.project_type)}`
            : intel.firstLine.slice(0, 80) || `${prettyProjectType(le.project_type)} project`;

        return {
          id: le.id,
          title,
          source: isScraped
            ? l === "en"
              ? "Municipal Permit"
              : "Permis municipal"
            : l === "en"
              ? "Homeowner Request"
              : "Demande propriétaire",
          location:
            intel.loc ||
            le.city ||
            (l === "en" ? "Location not listed" : "Emplacement non listé"),
          projectType: le.project_type,
          value: le.score ? `Score ${le.score}` : "—",
          description: le.message || "",
          createdAt: le.created_at,
          isUnlocked: true,
          status: le.status,
          name: isScraped ? undefined : name,
          email: isSyntheticEmail(email) ? undefined : email,
          phone: isScraped ? undefined : phone || undefined,
          url: undefined,
          leadKind: (isScraped ? "permit" : "form") as "form" | "permit",
          permitNumber: intel.permit || null,
          address: intel.loc || null,
        };
      }),
      ...marketLeads.map((le) => {
        const contact = (le as {
          lead_contacts?: { name: string; email: string; phone: string | null };
        }).lead_contacts;
        const unlocked = unlockedLeadIds.has(le.id);
        const name = contact?.name || (le as { name?: string }).name;
        const email = contact?.email || (le as { email?: string }).email;
        const phone =
          (contact?.phone || (le as { phone?: string | null }).phone) ?? undefined;
        const intel = parseIntel(le.message);
        const isScraped = le.source === "scraped";
        const title = isScraped
          ? `${prettyProjectType(le.project_type)}${intel.permit ? ` · #${intel.permit}` : ""}${intel.loc ? ` · ${intel.loc}` : ""}`
          : `${prettyProjectType(le.project_type)} — ${le.city || (l === "en" ? "Canada" : "Canada")}`;

        const showContact = unlocked;
        const realEmail = !isSyntheticEmail(email) ? email : undefined;

        return {
          id: le.id,
          title: title.length > 90 ? title.slice(0, 87) + "…" : title,
          source: isScraped
            ? l === "en"
              ? "Municipal Permit"
              : "Permis municipal"
            : l === "en"
              ? "Homeowner Request"
              : "Demande propriétaire",
          location:
            intel.loc ||
            le.city ||
            (l === "en" ? "Location not listed" : "Emplacement non listé"),
          projectType: le.project_type,
          value: le.score ? `Score ${le.score}` : "—",
          description: le.message || "",
          createdAt: le.created_at,
          isUnlocked: unlocked,
          name: showContact && !isScraped ? name : undefined,
          email: showContact ? realEmail : undefined,
          phone: showContact && !isScraped ? phone : showContact ? phone : undefined,
          url: undefined,
          leadKind: (isScraped ? "permit" : "form") as "form" | "permit",
          permitNumber: intel.permit || null,
          address: intel.loc || null,
        };
      }),
    ];

    // Live inventory — only map rows that look like real permits (skip 404 garbage)
    const municipalLeads: LeadData[] = permits
      .filter((p) => {
        const t = String((p as { title?: string }).title || "");
        return t && !/404|not found|passer directement|dataset not found/i.test(t);
      })
      .map((p) => {
        const row = p as {
          id: string;
          title: string | null;
          address?: string | null;
          city?: string | null;
          permit_number?: string | null;
          project_type?: string | null;
          estimated_value?: number | null;
          description?: string | null;
          source_url?: string | null;
          scraped_at: string;
          applicant_name?: string | null;
        };
        // Unlock state: inventory id may not be in lead_unlocks (FK is leads.id).
        // Mark unlocked if any unlock exists for a promoted lead with same permit/email pattern —
        // for simplicity, always start locked unless address already in description of unlocked leads.
        const street = row.address || null;
        const titleBase =
          row.title && row.title.length > 3
            ? row.title
            : prettyProjectType(row.project_type || "general");

        return {
          id: row.id,
          title: `${titleBase}${row.permit_number ? ` · #${row.permit_number}` : ""}`,
          source: l === "en" ? "Municipal Permit" : "Permis municipal",
          location:
            street ||
            row.city ||
            (l === "en" ? "Location not listed" : "Emplacement non listé"),
          projectType: row.project_type || "general",
          value: row.estimated_value
            ? `$${Number(row.estimated_value).toLocaleString()}`
            : "—",
          description: [
            row.description,
            street ? `${l === "en" ? "Address" : "Adresse"}: ${street}` : null,
            row.permit_number
              ? `${l === "en" ? "Permit #" : "Permis #"}: ${row.permit_number}`
              : null,
            row.city ? `City: ${row.city}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          createdAt: row.scraped_at,
          isUnlocked: false,
          name: undefined,
          email: undefined,
          phone: undefined,
          url: row.source_url || undefined,
          leadKind: "permit" as const,
          permitNumber: row.permit_number || null,
          address: street,
        };
      });

    const realLeads: LeadData[] = [...allDataLeads, ...municipalLeads];
    displayLeads = realLeads.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = {
    total: isFree ? 0 : myLeads.length,
    newThisWeek: isFree ? 0 : myLeads.filter((l) => {
      const d = new Date(l.created_at);
      const now = new Date();
      return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length,
    converted: isFree ? 0 : myLeads.filter((l) => l.status === "converted").length,
    revenue: isFree ? 0 : myLeads.filter((l) => l.status === "converted").length * 8500,
  };

  return (
    <div className="space-y-6">
      <SubscriptionSyncBanner
        lang={l}
        justPaid={justPaid}
        currentTier={rawTier ?? null}
      />

      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          {t("dashboard.title", l)}
        </h2>
        <p className="text-muted-foreground text-sm">
          {l === "en" ? "Your leads, claims, and permit radar." : "Vos leads, réclamations et radar de permis."}
        </p>
      </div>

      <DashboardStats stats={stats} lang={l} />

      {isFree && !testAccess && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-display font-bold text-lg text-foreground mb-1">
                {l === "en" ? "You're viewing demo data" : "Vous voyez des données démo"}
              </p>
              <p className="text-muted-foreground text-sm">
                {l === "en"
                  ? "Upgrade to unlock real homeowner contacts and municipal permit addresses."
                  : "Passez au niveau supérieur pour débloquer les contacts propriétaires et les adresses de permis."}
              </p>
            </div>
            <a
              href={`/${l}#pricing`}
              className="btn-amber shrink-0 text-sm"
            >
              {l === "en" ? "View Plans" : "Voir les plans"}
            </a>
          </div>
        </div>
      )}

      <div className="glass-card cyber-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-sm text-foreground mb-4">
          {l === "en" ? "Lead Sources" : "Sources de leads"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {l === "en" ? "Direct Network Leads" : "Leads directs du réseau"}
            </p>
            <p className="font-display text-2xl font-bold text-foreground mt-2">
              {isFree ? "—" : canSeeAllData ? myLeads.length + marketLeads.length : 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isFree
                ? (l === "en" ? "Upgrade to see real leads." : "Améliorez pour voir les vrais leads.")
                : canSeeAllData
                  ? (l === "en" ? "Captured from homeowner form submissions." : "Capturés via les soumissions du formulaire propriétaire.")
                  : (l === "en" ? "Unlocked on tier 3 (all-data access)." : "Débloqué au niveau 3 (accès toutes données).")}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {l === "en" ? "Firecrawl Market Signals" : "Signaux marché Firecrawl"}
            </p>
            <p className="font-display text-2xl font-bold text-foreground mt-2">
              {isFree ? "—" : permits.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isFree
                ? (l === "en" ? "Upgrade to see permit addresses." : "Améliorez pour voir les adresses de permis.")
                : (l === "en" ? "Latest permit opportunities from scraped inventory." : "Dernières opportunités permis depuis l'inventaire scrappé.")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <LeadMarketplace
            lang={l}
            userTier={isFree ? "free" : tier}
            initialLeads={displayLeads}
          />
        </div>

        {/* Activity Log */}
        <div className="glass-card cyber-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">
            {t("dashboard.automationLog", l)}
          </h3>
          {!logs?.length ? (
            <p className="text-muted-foreground text-sm">{t("dashboard.noActivity", l)}</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.status === "sent" ? "bg-amber-500" : "bg-muted-foreground"}`} />
                  <div className="min-w-0">
                    <p className="font-display text-xs text-foreground truncate">{log.event_type}</p>
                    <p className="text-muted-foreground text-xs">{log.channel} · {new Date(log.created_at).toLocaleDateString(l === "fr" ? "fr-CA" : "en-CA")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
