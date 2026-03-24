"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radar, Settings, FileText, LogOut, ChevronRight, Activity } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DashboardSidebarProps {
  lang: Lang;
}

export default function DashboardSidebar({ lang }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: `/${lang}/dashboard`, icon: LayoutDashboard, label: t("dashboard.leads", lang) },
    { href: `/${lang}/dashboard/radar`, icon: Radar, label: t("dashboard.radar", lang) },
    { href: `/${lang}/dashboard/log`, icon: FileText, label: t("dashboard.automationLog", lang) },
    { href: `/${lang}/dashboard/ops`, icon: Activity, label: lang === "en" ? "Ops Health" : "Santé Ops" },
    { href: `/${lang}/settings`, icon: Settings, label: t("dashboard.settings", lang) },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${lang}`);
    router.refresh();
  };

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-white/[0.06] bg-black/30 backdrop-blur-sm">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.06]">
        <Link href={`/${lang}`} className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-black font-bold text-xs font-display">TC</span>
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-foreground group-hover:text-amber-400 transition-colors">
            TRADES-CANADA
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== `/${lang}/dashboard` && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={isActive ? "sidebar-item-active" : "sidebar-item"}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-sm">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-white/[0.06]">
        <button onClick={handleSignOut} className="sidebar-item w-full text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-4 h-4" />
          {lang === "en" ? "Sign Out" : "Déconnexion"}
        </button>
      </div>
    </aside>
  );
}
