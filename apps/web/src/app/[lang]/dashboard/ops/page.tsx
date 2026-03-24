import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isValidLang, type Lang } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@/types/database";

interface OpsPageProps {
  params: Promise<{ lang: string }>;
}

export const metadata: Metadata = {
  title: "Ops Health | Trades-Canada",
  robots: { index: false, follow: false },
};

export default async function OpsHealthPage({ params }: OpsPageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${lang}/auth`);

  type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
  type LogRow = Database["public"]["Tables"]["automated_logs"]["Row"];

  const dayAgoIso = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: leadsData } = await supabase
    .from("leads")
    .select("id, created_at")
    .gte("created_at", dayAgoIso);

  const { data: logsData } = await supabase
    .from("automated_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  const leads = (leadsData ?? []) as Pick<LeadRow, "id" | "created_at">[];
  const logs = (logsData ?? []) as LogRow[];

  const stripeWebhookLogs = logs.filter(
    (log) => log.channel === "stripe" && log.event_type === "stripe.webhook"
  );
  const failedStripeWebhookLogs = stripeWebhookLogs.filter((log) => log.status === "failed");
  const lastSuccessfulStripeWebhook = stripeWebhookLogs.find((log) => log.status === "sent");
  const failureRate =
    stripeWebhookLogs.length === 0
      ? 0
      : Math.round((failedStripeWebhookLogs.length / stripeWebhookLogs.length) * 100);

  const stripeHealth =
    failedStripeWebhookLogs.length === 0 ? "healthy" : failureRate <= 20 ? "degraded" : "critical";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          {l === "en" ? "Ops Health" : "Santé opérationnelle"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {l === "en"
            ? "Quick view of lead intake and Stripe webhook reliability."
            : "Vue rapide de l'ingestion de leads et de la fiabilité des webhooks Stripe."}
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="glass-card cyber-border rounded-xl p-5">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            {l === "en" ? "Leads (24h)" : "Leads (24h)"}
          </p>
          <p className="font-display font-bold text-3xl text-foreground mt-2">{leads.length}</p>
        </article>

        <article className="glass-card cyber-border rounded-xl p-5">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            {l === "en" ? "Stripe Webhook Events" : "Événements webhook Stripe"}
          </p>
          <p className="font-display font-bold text-3xl text-foreground mt-2">
            {stripeWebhookLogs.length}
          </p>
        </article>

        <article className="glass-card cyber-border rounded-xl p-5">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            {l === "en" ? "Stripe Webhook Failures" : "Échecs webhook Stripe"}
          </p>
          <p className="font-display font-bold text-3xl text-destructive mt-2">
            {failedStripeWebhookLogs.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {l === "en" ? "Failure rate" : "Taux d'échec"}: {failureRate}%
          </p>
        </article>
      </section>

      <section className="glass-card cyber-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">
          {l === "en" ? "Status Indicators" : "Indicateurs d'état"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {l === "en" ? "Stripe Webhook Health" : "Santé webhook Stripe"}
            </p>
            <span
              className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                stripeHealth === "healthy"
                  ? "text-green-300 border-green-500/30 bg-green-500/10"
                  : stripeHealth === "degraded"
                    ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
                    : "text-destructive border-destructive/30 bg-destructive/10"
              }`}
            >
              {stripeHealth === "healthy"
                ? l === "en"
                  ? "Healthy"
                  : "Sain"
                : stripeHealth === "degraded"
                  ? l === "en"
                    ? "Degraded"
                    : "Dégradé"
                  : l === "en"
                    ? "Critical"
                    : "Critique"}
            </span>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {l === "en" ? "Last Successful Stripe Webhook" : "Dernier webhook Stripe réussi"}
            </p>
            <p className="mt-2 text-xs text-foreground">
              {lastSuccessfulStripeWebhook
                ? new Date(lastSuccessfulStripeWebhook.created_at).toLocaleString(
                    l === "fr" ? "fr-CA" : "en-CA"
                  )
                : l === "en"
                  ? "No successful webhook yet."
                  : "Aucun webhook réussi pour le moment."}
            </p>
          </div>
        </div>
      </section>

      <section className="glass-card cyber-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-sm text-foreground mb-3">
          {l === "en" ? "Quick Runbook" : "Guide rapide"}
        </h3>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>
            {l === "en"
              ? "1) If webhook failures spike, confirm Stripe endpoint points to /api/webhooks/stripe."
              : "1) Si les échecs webhook montent, confirmez le endpoint Stripe vers /api/webhooks/stripe."}
          </li>
          <li>
            {l === "en"
              ? "2) Verify legacy Supabase webhook flag stays disabled."
              : "2) Vérifiez que le webhook Supabase legacy reste désactivé."}
          </li>
          <li>
            {l === "en"
              ? "3) For lead spam, tighten /api/leads rate limits and review suspicious IPs."
              : "3) En cas de spam lead, resserrez les limites /api/leads et analysez les IP suspectes."}
          </li>
        </ul>
      </section>

      <section className="glass-card cyber-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-sm text-foreground mb-4">
          {l === "en" ? "Recent automation events" : "Événements récents d'automatisation"}
        </h3>
        {!logs.length ? (
          <p className="text-muted-foreground text-sm">
            {l === "en" ? "No events yet." : "Aucun événement pour le moment."}
          </p>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 12).map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="font-display text-xs text-foreground truncate">
                    {log.channel} · {log.event_type}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(log.created_at).toLocaleString(l === "fr" ? "fr-CA" : "en-CA")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    log.status === "failed"
                      ? "text-destructive border-destructive/30 bg-destructive/10"
                      : "text-amber-300 border-amber-500/30 bg-amber-500/10"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
