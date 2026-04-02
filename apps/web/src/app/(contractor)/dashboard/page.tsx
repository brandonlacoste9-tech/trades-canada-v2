import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { isValidLang, defaultLocale } from "@/lib/i18n";

// Legacy /dashboard route — redirect to the canonical /{lang}/dashboard
export default async function ContractorDashboardPage() {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("next-locale")?.value;
  const lang = isValidLang(cookieLang ?? "") ? cookieLang : defaultLocale;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/auth`);
  }

  redirect(`/${lang}/dashboard`);
}
