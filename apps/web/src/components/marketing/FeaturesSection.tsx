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
      </div>
    </section>
  );
}
