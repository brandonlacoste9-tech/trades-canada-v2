import { createClient } from "@/lib/supabase/server";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import LeadRadarClient from "@/components/dashboard/LeadRadarClient";
import { normalizeTier } from "@/lib/leadEligibility";

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

  const { data: profileData } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const rawTier = (profileData as { subscription_tier?: string | null } | null)?.subscription_tier;
  const testAccess = user.email === "brandonlacoste9@gmail.com";
  const tier = rawTier ? normalizeTier(rawTier) : "starter";
  const isFree = (!rawTier || rawTier === "" || rawTier === "free") && !testAccess;
  const hasMunicipalAccess = !isFree;
  const hasAllDataAccess = tier === "elite" || testAccess;

  if (!hasMunicipalAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-1">
            {t("dashboard.radar", l)}
          </h2>
          <p className="text-muted-foreground text-sm">
            {l === "en"
              ? "Municipal permit intelligence is unlocked on tier 2+."
              : "L'intelligence des permis municipaux se débloque au niveau 2+."}
          </p>
        </div>
        <div className="glass-card cyber-border rounded-2xl p-6">
          <p className="text-foreground font-display font-semibold mb-2">
            {l === "en" ? "You're currently in demo mode." : "Vous êtes actuellement en mode démo."}
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            {l === "en"
              ? "Upgrade to tier 2 for municipal data, then tier 3 for full lead + Apollo enrichment."
              : "Passez au niveau 2 pour les données municipales, puis au niveau 3 pour toutes les données + enrichissement Apollo."}
          </p>
          <a href={`/${l}#pricing`} className="btn-amber text-sm">
            {l === "en" ? "View Plans" : "Voir les plans"}
          </a>
        </div>
      </div>
    );
  }

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
        <p className="text-xs text-amber-400 mt-1">
          {hasAllDataAccess
            ? l === "en"
              ? "Tier 3: full data access enabled (includes Apollo enrichment on unlock)."
              : "Niveau 3 : accès complet activé (inclut l'enrichissement Apollo lors du déverrouillage)."
            : l === "en"
              ? "Tier 2: municipal data access enabled."
              : "Niveau 2 : accès aux données municipales activé."}
        </p>
      </div>
      <LeadRadarClient permits={permits ?? []} lang={l} />
    </div>
  );
}
