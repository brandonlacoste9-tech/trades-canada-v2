"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Globe, User, X, Check, Zap, RefreshCw } from "lucide-react";
import { type Lang } from "@/lib/i18n";
import type { Database } from "@/types/database";
import { getCanonicalPriceIds } from "@/lib/stripe-prices";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

interface DashboardTopbarProps {
  lang: Lang;
  profile: Profile;
}

const PLANS_DETAILS = [
  {
    id: "starter",
    nameEn: "Lead Starter",
    nameFr: "Démarreur de Leads",
    price: "$149",
    descEn: "Essential leads and market alerts.",
    descFr: "Leads essentiels et alertes de marché.",
    featuresEn: [
      "Real Homeowner Leads",
      "Municipal Permit Data",
      "Bilingual Lead Alerts",
      "Real-time Telegram Engine",
      "City-specific targeting",
    ],
    featuresFr: [
      "Vrais leads propriétaires",
      "Données de permis municipaux",
      "Alertes de leads bilingues",
      "Moteur Telegram en temps réel",
      "Ciblage par ville",
    ],
    highlight: false,
  },
  {
    id: "engine",
    nameEn: "Lead Engine",
    nameFr: "Moteur de Leads",
    price: "$349",
    descEn: "Unlimited claims and automation.",
    descFr: "Réclamations illimitées et automatisation.",
    featuresEn: [
      "Everything in Lead Starter",
      "Unlimited Marketplace Claims",
      "Lead capture automation",
      "Planexa scheduling system",
      "AI-powered lead scoring",
      "Contractor dashboard",
    ],
    featuresFr: [
      "Tout du Démarreur de Leads",
      "Réclamations illimitées",
      "Automatisation de capture de leads",
      "Système de planification Planexa",
      "Scoring de leads par IA",
      "Tableau de bord entrepreneur",
    ],
    highlight: true,
  },
  {
    id: "dominator",
    nameEn: "Lead Dominator",
    nameFr: "Dominateur de Leads",
    price: "$599",
    descEn: "Priority access and enriched data.",
    descFr: "Accès prioritaire et données enrichies.",
    featuresEn: [
      "Everything in Lead Engine",
      "Market intelligence feed",
      "Enriched Contact Data",
      "Multi-channel automation",
      "Priority Lead Access",
      "Dedicated Support",
    ],
    featuresFr: [
      "Tout du Moteur de Leads",
      "Flux d'intelligence de marché",
      "Données contact enrichies (Email/Tél)",
      "Automatisation multicanal",
      "Accès prioritaire aux leads",
      "Support dédié",
    ],
    highlight: false,
  },
];

function normalizeDbTier(tier: string | null | undefined): string | null {
  if (!tier) return null;
  const t = tier.toLowerCase();
  if (t === "elite" || t === "dominator") return "dominator";
  if (t === "pro" || t === "engine") return "engine";
  if (t === "starter") return "starter";
  return t;
}

export default function DashboardTopbar({ lang, profile }: DashboardTopbarProps) {
  const otherLang = lang === "en" ? "fr" : "en";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplying, setIsPromoApplying] = useState(false);

  const normalizedTier = normalizeDbTier(profile?.subscription_tier);

  const priceIds = getCanonicalPriceIds();

  const handleUpgrade = async (tier: "starter" | "engine" | "dominator") => {
    const priceId = priceIds[tier];
    setUpgradingId(priceId);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, lang }),
      });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No URL returned from checkout session.");
      }
    } catch (err) {
      console.error("Upgrade error in Topbar:", err);
      toast.error(
        lang === "en"
          ? "Failed to initiate checkout. Please try again."
          : "Échec du lancement du paiement. Veuillez réessayer."
      );
    } finally {
      setUpgradingId(null);
    }
  };

  const handlePromoBypass = async () => {
    if (!promoCode.trim()) return;
    setIsPromoApplying(true);
    try {
      const response = await fetch("/api/stripe/promo-bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      toast.success(
        lang === "en"
          ? "Promo code activated! Welcome to Lead Dominator!"
          : "Code promo activé ! Bienvenue sur Dominateur de Leads !"
      );
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Promo bypass error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(errMsg || (lang === "en" ? "Invalid promo code." : "Code promo invalide."));
    } finally {
      setIsPromoApplying(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 relative z-40">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-semibold text-sm text-foreground">
              {lang === "en" ? "Contractor Dashboard" : "Tableau de bord entrepreneur"}
            </h1>
            {normalizedTier ? (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-display font-bold border shrink-0 uppercase tracking-wider ${
                normalizedTier === "dominator"
                  ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                  : normalizedTier === "engine"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : normalizedTier === "starter"
                  ? "bg-white/10 border-white/20 text-foreground"
                  : "bg-white/[0.04] border-white/[0.08] text-muted-foreground"
              }`}>
                {normalizedTier === "free" ? (lang === "en" ? "Free" : "Gratuit") : normalizedTier}
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-display font-bold border bg-white/[0.04] border-white/[0.08] text-muted-foreground shrink-0 uppercase tracking-wider">
                {lang === "en" ? "Free" : "Gratuit"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Upgrade Button */}
          {(!normalizedTier || 
            (normalizedTier !== "engine" && normalizedTier !== "dominator")) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-display font-bold hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer animate-glow-pulse"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              {lang === "en" ? "Upgrade Plan" : "Améliorer le plan"}
            </button>
          )}

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

      {/* Subscription Overlay Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative z-10 glass-card cyber-border max-w-5xl w-full rounded-2xl p-6 md:p-8 flex flex-col max-h-[90vh] shadow-2xl bg-black/90"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div className="text-center mb-8 pr-6">
                <span className="badge-amber mb-2 inline-flex">
                  {lang === "en" ? "Trades-Canada Growth Engine" : "Moteur de croissance Trades-Canada"}
                </span>
                <h2 className="font-display font-extrabold text-2xl md:text-3xl text-foreground">
                  {lang === "en" ? "Choose Your Subscription Plan" : "Choisissez votre plan d'abonnement"}
                </h2>
                <p className="text-muted-foreground text-sm max-w-xl mx-auto mt-2">
                  {lang === "en"
                    ? "Select the tier that best matches your business growth target. Secure checkouts backed by Stripe."
                    : "Sélectionnez le niveau qui correspond le mieux à votre objectif de croissance. Paiements sécurisés via Stripe."}
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-1 mb-6 flex-1 py-1">
                {PLANS_DETAILS.map((plan) => {
                  const isCurrent = normalizedTier === plan.id;
                  const priceId = priceIds[plan.id as "starter" | "engine" | "dominator"];
                  const isUpgrading = upgradingId === priceId;

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl p-5 flex flex-col justify-between transition-all duration-300 ${
                        plan.highlight
                          ? "bg-amber-500/[0.03] border-2 border-amber-500/50 shadow-amber-sm"
                          : "bg-white/[0.01] border border-white/[0.08] hover:border-white/[0.15]"
                      }`}
                    >
                      {plan.highlight && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-display font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                          {lang === "en" ? "Most Popular" : "Le plus populaire"}
                        </span>
                      )}

                      <div>
                        {/* Name & Price */}
                        <div className="mb-4">
                          <h3 className="font-display font-bold text-lg text-foreground">
                            {lang === "en" ? plan.nameEn : plan.nameFr}
                          </h3>
                          <p className="text-muted-foreground text-xs mt-1">
                            {lang === "en" ? plan.descEn : plan.descFr}
                          </p>
                          <div className="mt-3 flex items-baseline gap-1">
                            <span className="font-display font-extrabold text-3xl text-gradient-amber">
                              {plan.price}
                            </span>
                            <span className="text-muted-foreground text-xs">/ {lang === "en" ? "month" : "mois"}</span>
                          </div>
                        </div>

                        {/* Features List */}
                        <ul className="space-y-2.5 my-5 border-t border-white/[0.06] pt-5">
                          {(lang === "en" ? plan.featuresEn : plan.featuresFr).map((feat, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                              <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => !isCurrent && handleUpgrade(plan.id as "starter" | "engine" | "dominator")}
                        disabled={isCurrent || upgradingId !== null}
                        className={`w-full py-2.5 rounded-lg font-display font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                          isCurrent
                            ? "bg-white/[0.05] border border-white/[0.08] text-muted-foreground cursor-default"
                            : plan.highlight
                            ? "btn-amber hover:scale-[1.02]"
                            : "btn-outline-amber hover:scale-[1.02]"
                        }`}
                      >
                        {isUpgrading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-inherit" />
                        ) : isCurrent ? (
                          lang === "en" ? "Current Plan" : "Plan actuel"
                        ) : (
                          lang === "en" ? "Select Plan" : "Sélectionner le plan"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Promo Code Input Section */}
              <div className="border-t border-white/[0.06] py-3 flex flex-col items-center justify-center">
                {!showPromoInput ? (
                  <button
                    onClick={() => setShowPromoInput(true)}
                    className="text-[11px] text-muted-foreground hover:text-amber-400 transition-all font-semibold underline cursor-pointer"
                  >
                    {lang === "en" ? "Have a promo code?" : "Vous avez un code promo?"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 max-w-xs w-full">
                    <input
                      type="text"
                      placeholder={lang === "en" ? "Enter code" : "Entrez le code"}
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="input-amber text-[11px] py-1 px-2.5 flex-1"
                    />
                    <button
                      onClick={handlePromoBypass}
                      disabled={isPromoApplying || !promoCode.trim()}
                      className="btn-amber text-[11px] py-1 px-3 flex shrink-0 justify-center items-center gap-1 cursor-pointer font-bold"
                    >
                      {isPromoApplying ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        lang === "en" ? "Apply" : "Appliquer"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Secure Footer */}
              <div className="text-center text-xs text-muted-foreground border-t border-white/[0.06] pt-4">
                {lang === "en"
                  ? "🔒 Secure checkout processed via Stripe. Cancel or change your subscription at any time."
                  : "🔒 Paiement sécurisé traité via Stripe. Annulez ou modifiez votre abonnement à tout moment."}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
