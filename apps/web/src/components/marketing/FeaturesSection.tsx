"use client";

import { motion } from "framer-motion";
import { Search, Target, Zap, CalendarDays, BarChart3, FileText } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

interface FeaturesSectionProps {
  lang: Lang;
}

const features = [
  {
    icon: Search,
    titleKey: "features.seo.title" as const,
    descKey: "features.seo.desc" as const,
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  {
    icon: Target,
    titleKey: "features.leads.title" as const,
    descKey: "features.leads.desc" as const,
    gradient: "from-amber-500/15 to-amber-600/5",
  },
  {
    icon: Zap,
    titleKey: "features.automation.title" as const,
    descKey: "features.automation.desc" as const,
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  {
    icon: CalendarDays,
    titleKey: "features.scheduling.title" as const,
    descKey: "features.scheduling.desc" as const,
    gradient: "from-amber-500/15 to-amber-600/5",
  },
  {
    icon: BarChart3,
    titleKey: "features.radar.title" as const,
    descKey: "features.radar.desc" as const,
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  {
    icon: FileText,
    titleKey: "features.intel.title" as const,
    descKey: "features.intel.desc" as const,
    gradient: "from-amber-500/15 to-amber-600/5",
  },
];

export default function FeaturesSection({ lang }: FeaturesSectionProps) {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-amber-glow-sm" />
      <div className="section-container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="section-label mx-auto w-fit">{t("features.badge", lang)}</div>
          <h2 className="heading-lg mt-4 mb-4">{t("features.heading", lang)}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("features.sub", lang)}</p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, titleKey, descKey, gradient }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <div className="feature-card group h-full">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base text-foreground mb-2">
                    {t(titleKey, lang)}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(descKey, lang)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Telegram Spotlight */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="mt-16 p-8 sm:p-12 rounded-[2rem] bg-gradient-to-br from-blue-600/10 via-transparent to-amber-500/5 border border-white/[0.08] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-32 h-32 text-blue-400" />
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
            <div className="lg:w-2/3">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                  <Zap className="text-white fill-current" size={20} />
                </div>
                <h3 className="text-2xl font-bold font-display">{t("features.telegram.title", lang)}</h3>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {t("features.telegram.desc", lang)}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { en: "Instant Push Notifications", fr: "Notifications push instantanées" },
                  { en: "Claim Leads in Seconds", fr: "Réclamez des leads en quelques secondes" },
                  { en: "No Email Delays", fr: "Pas de délais de courriel" },
                  { en: "Direct CRM Integration", fr: "Intégration directe CRM" },
                ].map((item) => (
                  <li key={item.en} className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {lang === "en" ? item.en : item.fr}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="lg:w-1/3 w-full">
              <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl relative">
                <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Zap className="text-blue-400" size={16} />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/60">Live Alert System</div>
                </div>
                <div className="space-y-3">
                   <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1" />
                      <div>
                        <div className="font-bold mb-0.5 text-blue-400">🚨 New High-Value Lead!</div>
                        <div className="text-white/60">Vancouver, BC • Roofing • $5k Est.</div>
                      </div>
                   </div>
                   <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/40 italic">
                      &quot;Just closed a $12k job before it even went to the marketplace. Telegram alerts are a cheat code.&quot;
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
