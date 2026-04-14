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
  // Tier model requested: free => mock, tier 2 => municipal only, tier 3 => all data.
  const canSeeAllData = isElite;

  // ── TIER-GATED DATA FETCHING ───────────────────────────────────────────
  // Free tier: mock data only.  Starter+: real leads.  Elite: leads + permits.

  let myLeads: LeadRow[] = [];
  let marketLeads: LeadRow[] = [];
  let permits: PermitRow[] = [];
  let logs: LogRow[] = [];
  let unlockedLeadIds = new Set<string>();

  if (isPaid) {
    // ── Tier 3: all data (direct network + municipal) ────────────────
    if (canSeeAllData) {
      const { data: leadsData } = await supabase
        .from("leads")
        .select("*")
        .or(`contractor_id.eq.${user.id},contractor_id.is.null`)
        .order("created_at", { ascending: false })
        .limit(50);
      const leads = leadsData as LeadRow[] | null;

      myLeads = leads?.filter((l) => l.contractor_id === user.id) ?? [];
      const marketLeadsRaw = leads?.filter((lead) => lead.contractor_id === null) ?? [];
      marketLeads = profileData
        ? marketLeadsRaw.filter((lead) => evaluateLeadEligibility(lead, profileData).eligible)
        : marketLeadsRaw;
    }

    // ── Tier 2+: municipal permit intelligence ────────────────────────
    if (canSeeMunicipalData) {
      const { data: permitsData } = await supabase
        .from("scraped_inventory")
        .select("*")
        .order("scraped_at", { ascending: false })
        .limit(20);
      permits = (permitsData ?? []) as PermitRow[];
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
  };

  let displayLeads: LeadData[];

  if (isFree) {
    // ── FREE TIER: Mock data only ────────────────────────────────────
    displayLeads = getMockLeads(l);
  } else {
    // ── PAID TIERS: Real data ────────────────────────────────────────
    const allDataLeads: LeadData[] = canSeeAllData
      ? [
          ...myLeads.map((le) => ({
            id: le.id,
            title: le.message
              ? le.message.length > 50
                ? `${le.message.substring(0, 50)}...`
                : le.message
              : `${le.project_type.charAt(0).toUpperCase() + le.project_type.slice(1)} Project`,
            source: l === "en" ? "Direct Request" : "Demande directe",
            location: le.city || (l === "en" ? "Location hidden" : "Emplacement masqué"),
            projectType: le.project_type,
            value: le.score ? `$${(le.score * 50).toFixed(0)}` : "TBD",
            description: le.message || "",
            createdAt: le.created_at,
            isUnlocked: true,
            status: le.status,
            name: le.name,
            email: le.email,
            phone: le.phone ?? undefined,
          })),
          ...marketLeads.map((le) => ({
            id: le.id,
            title: le.message
              ? le.message.length > 50
                ? `${le.message.substring(0, 50)}...`
                : le.message
              : `${le.project_type.charAt(0).toUpperCase() + le.project_type.slice(1)} Project`,
            source: l === "en" ? "Direct Request" : "Demande directe",
            location: le.city || (l === "en" ? "Location hidden" : "Emplacement masqué"),
            projectType: le.project_type,
            value: le.score ? `$${(le.score * 50).toFixed(0)}` : "TBD",
            description: le.message || "",
            createdAt: le.created_at,
            isUnlocked: unlockedLeadIds.has(le.id),
            name: unlockedLeadIds.has(le.id) ? le.name : undefined,
            email: unlockedLeadIds.has(le.id) && isElite ? le.email : undefined,
            phone: unlockedLeadIds.has(le.id) && isElite ? le.phone ?? undefined : undefined,
          })),
        ]
      : [];

    const municipalLeads: LeadData[] = permits.map((p) => {
      const isUnlocked = unlockedLeadIds.has(p.id);
      let phoneOption = undefined;
      let nameOption = undefined;
      if (isUnlocked && isElite) {
        phoneOption = "(Apollo Enriched)";
        nameOption = `Verified Owner (Permit ${p.permit_number || "N/A"})`;
      } else if (isUnlocked) {
        nameOption = `Permit: ${p.permit_number || "Open Data"}`;
      }
      return {
        id: p.id,
        title: p.title,
        source: l === "en" ? "Municipal Data" : "Données municipales",
        location: p.location || p.city || (l === "en" ? "Location hidden" : "Emplacement masqué"),
        projectType: p.project_type || "general",
        value: p.estimated_value ? `$${p.estimated_value.toLocaleString()}` : "N/A",
        description: p.description || "",
        createdAt: p.scraped_at,
        isUnlocked,
        name: nameOption,
        url: isUnlocked ? p.url ?? undefined : undefined,
        phone: phoneOption,
      };
    });

    const realLeads: LeadData[] = [...allDataLeads, ...municipalLeads];

    displayLeads = realLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      {/* Subscription sync banner — shown after Stripe checkout redirect */}
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
          {l === "en" ? "Your leads, automation, and market intelligence." : "Vos leads, automatisation et intelligence de marché."}
        </p>
      </div>

      <DashboardStats stats={stats} lang={l} />

      {/* ── Free Tier Upgrade Banner ─────────────────────────────────────── */}
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
                  ? "Upgrade to unlock municipal intelligence (tier 2) and full lead + Apollo enriched data (tier 3)."
                  : "Passez au niveau supérieur pour débloquer l'intelligence municipale (niveau 2) et les données complètes + enrichissement Apollo (niveau 3)."}
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
                ? (l === "en" ? "Upgrade to see permit intel." : "Améliorez pour l'intelligence permis.")
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
