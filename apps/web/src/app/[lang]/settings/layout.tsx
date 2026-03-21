import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidLang, type Lang } from "@/lib/i18n";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function SettingsLayout({ children, params }: SettingsLayoutProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) redirect("/en/auth");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/auth`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const l = lang as Lang;

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardSidebar lang={l} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar lang={l} profile={profile} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
