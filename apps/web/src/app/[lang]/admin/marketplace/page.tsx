import { type Lang } from "@/lib/i18n";
import MarketplaceAnalytics from "@/components/admin/MarketplaceAnalytics";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";


interface AdminPageProps {
  params: Promise<{
    lang: Lang;
  }>;
}

export default async function AdminMarketplacePage({ params }: AdminPageProps) {
  const { lang } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${lang}/auth`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") notFound();

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-amber-500/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80">Market Intelligence Command</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase font-display bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              {lang === "en" ? "Marketplace Analytics" : "Analyses du marché"}
            </h1>
            <p className="text-muted-foreground text-sm font-medium max-w-xl leading-relaxed">
              Real-time monitoring of lead flow, contractor engagement, and monetization health. 
              Optimize your marketplace growth with data-driven network intelligence.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="glass-card-hover cyber-border px-4 py-2 rounded-xl flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Mode Active</span>
            </div>
          </div>
        </div>

        {/* Analytics Component */}
        <MarketplaceAnalytics />
      </div>

      {/* Background Polish */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>
    </div>
  );
}
