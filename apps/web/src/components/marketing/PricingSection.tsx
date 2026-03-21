"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Zap, ArrowRight } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

interface PricingSectionProps {
  lang: Lang;
}

const plans = [
  {
    nameKey: "pricing.starter.name" as const,
    price: "$149",
    priceId: "price_1TCyD0CzqBvMqSYFhDyf6YDp",
    features: {
      en: [
        "Custom bilingual website",
        "Basic SEO setup",
        "Mobile responsive design",
        "Contact form integration",
        "Google My Business setup",
      ],
      fr: [
        "Site web bilingue personnalisé",
        "Configuration SEO de base",
        "Design adaptatif mobile",
        "Intégration de formulaire de contact",
        "Configuration Google My Business",
      ],
    },
    popular: false,
    cta: "pricing.cta" as const,
  },
  {
    nameKey: "pricing.engine.name" as const,
    price: "$349",
    priceId: "price_1TCyDeCzqBvMqSYFl3sEMMw2",
    features: {
      en: [
        "Everything in Web Starter",
        "Lead capture automation",
        "Planexa scheduling system",
        "Automated email follow-ups",
        "Monthly SEO optimization",
        "Contractor dashboard",
      ],
      fr: [
        "Tout du Démarreur Web",
        "Automatisation de capture de leads",
        "Système de planification Planexa",
        "Suivis courriel automatisés",
        "Optimisation SEO mensuelle",
        "Tableau de bord entrepreneur",
      ],
    },
    popular: true,
    cta: "pricing.cta" as const,
  },
  {
    nameKey: "pricing.dominator.name" as const,
    price: "$599",
    priceId: "price_1TCyHwCzqBvMqSYFbv2HxlVh",
    features: {
      en: [
        "Everything in Lead Engine",
        "Market intelligence feed",
        "AI-powered lead scoring",
        "Multi-channel automation",
        "Priority support",
        "Quarterly strategy sessions",
      ],
      fr: [
        "Tout du Moteur de Leads",
        "Flux d'intelligence de marché",
        "Scoring de leads par IA",
        "Automatisation multicanal",
        "Support prioritaire",
        "Sessions stratégiques trimestrielles",
      ],
    },
    popular: false,
    cta: "pricing.cta" as const,
  },
];

export default function PricingSection({ lang }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-amber-glow-sm" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="section-label mx-auto w-fit">{t("pricing.badge", lang)}</div>
          <h2 className="heading-lg mt-4 mb-4">{t("pricing.heading", lang)}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("pricing.sub", lang)}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.nameKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 flex flex-col gap-6 ${
                plan.popular
                  ? "bg-amber-500/8 border border-amber-500/30 shadow-amber"
                  : "glass-card cyber-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-500 text-black text-xs font-display font-bold shadow-amber-sm">
                    <Zap className="w-3 h-3" />
                    {t("pricing.popular", lang)}
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-display font-bold text-base text-foreground mb-3">
                  {t(plan.nameKey, lang)}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-bold text-4xl text-gradient-amber">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{t("pricing.month", lang)}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features[lang].map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/${lang}/auth?plan=${plan.priceId}`}
                className={plan.popular ? "btn-amber justify-center" : "btn-outline-amber justify-center"}
              >
                {t(plan.cta, lang)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
