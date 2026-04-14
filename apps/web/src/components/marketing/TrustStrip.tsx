"use client";

import { ShieldCheck, Zap, Globe2, Lock } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

const keys = ["trust.item1", "trust.item2", "trust.item3", "trust.item4"] as const;
const icons = [Globe2, Zap, ShieldCheck, Lock];

interface TrustStripProps {
  lang: Lang;
}

export default function TrustStrip({ lang }: TrustStripProps) {
  return (
    <section
      aria-label={t("trust.aria", lang)}
      className="relative z-10 border-y border-white/[0.06] bg-black/25 backdrop-blur-sm"
    >
      <div className="section-container py-6">
        <p className="text-center text-xs font-display uppercase tracking-widest text-muted-foreground mb-4">
          {t("trust.title", lang)}
        </p>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {keys.map((key, i) => {
            const Icon = icons[i];
            return (
              <li
                key={key}
                className="flex items-center gap-2.5 justify-center text-center text-sm text-muted-foreground"
              >
                <Icon className="w-4 h-4 shrink-0 text-amber-500/90" aria-hidden />
                <span>{t(key, lang)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
