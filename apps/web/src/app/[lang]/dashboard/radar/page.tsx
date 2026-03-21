import { createClient } from "@/lib/supabase/server";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import LeadRadarClient from "@/components/dashboard/LeadRadarClient";

interface RadarPageProps {
  params: Promise<{ lang: string }>;
}

export default async function RadarPage({ params }: RadarPageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/auth`);

  // Fetch scraped permit data
  const { data: permits } = await supabase
    .from("scraped_inventory")
    .select("*")
    .order("scraped_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          {t("dashboard.radar", l)}
        </h2>
        <p className="text-muted-foreground text-sm">
          {l === "en"
            ? "Real-time market intelligence from permit data across Canada."
            : "Intelligence de marché en temps réel à partir des données de permis à travers le Canada."}
        </p>
      </div>
      <LeadRadarClient permits={permits ?? []} lang={l} />
    </div>
  );
}
