import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@/types/database";
import LeadList from "@/components/dashboard/LeadList";
import DashboardStats from "@/components/dashboard/DashboardStats";

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

  // Fetch leads for this contractor
  const { data: leadsData } = await supabase
    .from("leads")
    .select("*")
    .or(`contractor_id.eq.${user.id},contractor_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(50);
  const leads = leadsData as LeadRow[] | null;

  // Fetch automation logs
  const { data: logsData } = await supabase
    .from("automated_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  const logs = logsData as LogRow[] | null;

  const myLeads = leads?.filter((l) => l.contractor_id === user.id) ?? [];
  const marketLeads = leads?.filter((l) => l.contractor_id === null) ?? [];

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <LeadList leads={myLeads} marketLeads={marketLeads} lang={l} userId={user.id} />
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
