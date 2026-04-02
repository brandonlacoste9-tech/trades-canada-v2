import { createClient } from "@/lib/supabase/server";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@/types/database";
import { CheckCircle, XCircle, Clock, Zap, Mail, MessageCircle, CreditCard, FileText } from "lucide-react";

interface LogPageProps {
  params: Promise<{ lang: string }>;
}

const channelIcon = (channel: string) => {
  switch (channel) {
    case "telegram": return MessageCircle;
    case "stripe": return CreditCard;
    case "email": return Mail;
    case "firecrawl": return FileText;
    default: return Zap;
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case "sent": return { icon: CheckCircle, cls: "text-amber-400" };
    case "failed": return { icon: XCircle, cls: "text-destructive" };
    default: return { icon: Clock, cls: "text-muted-foreground" };
  }
};

export default async function LogPage({ params }: LogPageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/auth`);

  // Fetch logs related to this contractor's leads or sent to them directly
  const { data: logsData } = await supabase
    .from("automated_logs")
    .select("*")
    .or(`recipient.eq.${user.id},lead_id.in.(select id from leads where contractor_id.eq.${user.id})`)
    .order("created_at", { ascending: false })
    .limit(100);

  type LogRow = Database["public"]["Tables"]["automated_logs"]["Row"];
  const logs = logsData as LogRow[] | null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          {t("dashboard.automationLog", l)}
        </h2>
        <p className="text-muted-foreground text-sm">
          {l === "en"
            ? "All automated events: emails, Telegram alerts, Stripe webhooks, and scrape runs."
            : "Tous les événements automatisés: courriels, alertes Telegram, webhooks Stripe et exécutions de scraping."}
        </p>
      </div>

      <div className="glass-card cyber-border rounded-xl overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-3 flex items-center justify-between">
          <span className="font-display text-sm font-semibold text-foreground">
            {logs?.length ?? 0} {l === "en" ? "events" : "événements"}
          </span>
          <span className="badge-amber text-xs">
            {l === "en" ? "Live" : "En direct"}
          </span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {!logs?.length ? (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">
              {t("dashboard.noActivity", l)}
            </div>
          ) : (
            logs.map((log) => {
              const ChannelIcon = channelIcon(log.channel);
              const { icon: StatusIcon, cls } = statusIcon(log.status);

              return (
                <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                    <ChannelIcon className="w-4 h-4 text-amber-400/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display font-semibold text-sm text-foreground">
                        {log.event_type}
                      </span>
                      <span className={`text-xs font-display font-semibold ${cls} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {log.status}
                      </span>
                    </div>
                    {log.subject && (
                      <p className="text-muted-foreground text-xs truncate">{log.subject}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{log.channel}</span>
                      {log.recipient && <span>→ {log.recipient}</span>}
                      <span>{new Date(log.created_at).toLocaleString(l === "fr" ? "fr-CA" : "en-CA")}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
