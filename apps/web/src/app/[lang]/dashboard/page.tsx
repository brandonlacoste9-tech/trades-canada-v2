import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@/types/database";
import LeadList from "@/components/dashboard/LeadList";
import DashboardStats from "@/components/dashboard/DashboardStats";
import LeadMarketplace from "@/components/marketplace/LeadMarketplace";
import { evaluateLeadEligibility } from "@/lib/leadEligibility";

interface DashboardPageProps {
  params: Promise<{ lang: string }>;
}

export const metadata: Metadata = {
  title: "Dashboard | Trades-Canada",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/auth`);

  type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
  type LogRow = Database["public"]["Tables"]["automated_logs"]["Row"];
  type PermitRow = Database["public"]["Tables"]["scraped_inventory"]["Row"];

  // Fetch leads for this contractor
  const { data: leadsData } = await supabase
    .from("leads")
    .select("*")
    .or(`contractor_id.eq.${user.id},contractor_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(50);
  const leads = leadsData as LeadRow[] | null;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("subscription_tier, city, services")
    .eq("id", user.id)
    .single();

  // Fetch automation logs
  const { data: logsData } = await supabase
    .from("automated_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  const logs = logsData as LogRow[] | null;

  const { data: permitsData } = await supabase
    .from("scraped_inventory")
    .select("*")
    .order("scraped_at", { ascending: false })
    .limit(6);
  const permits = (permitsData ?? []) as PermitRow[];

  // Fetch this contractor's unlocked lead IDs
  const { data: unlocksData } = await supabase
    .from("lead_unlocks")
    .select("lead_id")
    .eq("contractor_id", user.id);
  const unlockedLeadIds = new Set((unlocksData ?? []).map((u) => u.lead_id));

  const myLeads = leads?.filter((l) => l.contractor_id === user.id) ?? [];
  const marketLeadsRaw = leads?.filter((lead) => lead.contractor_id === null) ?? [];
  const marketLeads = profileData
    ? marketLeadsRaw.filter((lead) => evaluateLeadEligibility(lead, profileData).eligible)
    : marketLeadsRaw;

  const aiActionMap: Record<string, "email_now" | "send_booking_link" | "nurture"> = {};
  for (const log of logs ?? []) {
    if (log.event_type !== "lead.ai_qualified" || !log.lead_id || !log.metadata) continue;
    if (typeof log.metadata !== "object" || Array.isArray(log.metadata)) continue;
    const nextActionRaw = (log.metadata as Record<string, unknown>).next_action;
    if (
      nextActionRaw === "email_now" ||
      nextActionRaw === "send_booking_link" ||
      nextActionRaw === "nurture"
    ) {
      aiActionMap[log.lead_id] = nextActionRaw;
    }
  }

  const stats = {
    total: myLeads.length,
    newThisWeek: myLeads.filter((l) => {
      const d = new Date(l.created_at);
      const now = new Date();
      return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length,
    converted: myLeads.filter((l) => l.status === "converted").length,
    revenue: myLeads.filter((l) => l.status === "converted").length * 8500,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          {t("dashboard.title", l)}
        </h2>
        <p className="text-muted-foreground text-sm">
          {l === "en" ? "Your leads, automation, and market intelligence." : "Vos leads, automatisation et intelligence de marché."}
        </p>
      </div>

      <DashboardStats stats={stats} lang={l} />

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
              {myLeads.length + marketLeads.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {l === "en"
                ? "Captured from homeowner form submissions."
                : "Capturés via les soumissions du formulaire propriétaire."}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {l === "en" ? "Firecrawl Market Signals" : "Signaux marché Firecrawl"}
            </p>
            <p className="font-display text-2xl font-bold text-foreground mt-2">{permits.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {l === "en"
                ? "Latest permit opportunities from scraped inventory."
                : "Dernières opportunités permis depuis l'inventaire scrappé."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <LeadMarketplace 
            lang={l} 
            initialLeads={[
              ...myLeads.map(le => ({
                id: le.id,
                title: le.message ? (le.message.length > 50 ? le.message.substring(0, 50) + "..." : le.message) : (l === 'en' ? "Direct Inquiry" : "Demande directe"),
                source: l === 'en' ? "Direct Request" : "Demande directe",
                location: le.city || 'Quebec, QC',
                projectType: le.project_type,
                value: le.score ? `$${(le.score * 50).toFixed(0)}` : "TBD",
                description: le.message || "",
                createdAt: le.created_at,
                isUnlocked: true,
                status: le.status,
                email: le.email,
                phone: le.phone
              })),
              ...marketLeads.map(le => ({
                id: le.id,
                title: le.message ? (le.message.length > 50 ? le.message.substring(0, 50) + "..." : le.message) : (l === 'en' ? "Direct Inquiry" : "Demande directe"),
                source: l === 'en' ? "Direct Request" : "Demande directe",
                location: le.city || 'Quebec, QC',
                projectType: le.project_type,
                value: le.score ? `$${(le.score * 50).toFixed(0)}` : "TBD",
                description: le.message || "",
                createdAt: le.created_at,
                isUnlocked: unlockedLeadIds.has(le.id),
                email: unlockedLeadIds.has(le.id) ? le.email : undefined,
                phone: unlockedLeadIds.has(le.id) ? le.phone : undefined,
              })),
              ...permits.map(p => ({
                id: p.id,
                title: p.title,
                source: l === 'en' ? "Municipal Data" : "Données municipales",
                location: p.location || p.city || 'Quebec, QC',
                projectType: p.project_type || 'general',
                value: p.estimated_value ? `$${p.estimated_value.toLocaleString()}` : "N/A",
                description: p.description || "",
                createdAt: p.scraped_at,
                isUnlocked: false
              }))
            ].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
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
