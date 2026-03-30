import { createClient } from "@/lib/supabase/server";
import { isValidLang, t, type Lang } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import SettingsClient from "@/components/dashboard/SettingsClient";

interface SettingsPageProps {
  params: Promise<{ lang: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  const l = lang as Lang;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/auth`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display font-bold text-2xl text-foreground mb-1">
          {t("settings.title", l)}
        </h2>
        <p className="text-muted-foreground text-sm">
          {l === "en" ? "Manage your profile, billing, and notification preferences." : "Gérez votre profil, facturation et préférences de notification."}
        </p>
      </div>
      <SettingsClient profile={profile} lang={l} userId={user.id} />
    </div>
  );
}
