"use client";

import Link from "next/link";
import { Bell, Globe, User } from "lucide-react";
import { type Lang } from "@/lib/i18n";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

interface DashboardTopbarProps {
  lang: Lang;
  profile: Profile;
}

export default function DashboardTopbar({ lang, profile }: DashboardTopbarProps) {
  const otherLang = lang === "en" ? "fr" : "en";

  return (
    <header className="h-16 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="font-display font-semibold text-sm text-foreground">
          {lang === "en" ? "Contractor Dashboard" : "Tableau de bord entrepreneur"}
        </h1>
        {profile?.subscription_tier && (
          <span className="text-xs text-amber-400 font-display">
            {profile.subscription_tier}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <Link
          href={`/${otherLang}/dashboard`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-muted-foreground text-xs font-display font-semibold hover:border-amber-500/30 hover:text-amber-400 transition-all"
        >
          <Globe className="w-3.5 h-3.5" />
          {otherLang.toUpperCase()}
        </Link>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
        </button>

        {/* Profile */}
        <Link
          href={`/${lang}/settings`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="font-display text-xs text-foreground hidden sm:block">
            {profile?.display_name ?? profile?.company_name ?? (lang === "en" ? "Account" : "Compte")}
          </span>
        </Link>
      </div>
    </header>
  );
}
