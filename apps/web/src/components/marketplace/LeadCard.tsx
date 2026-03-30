"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Lock, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  X,
  FileText,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lang, useTranslations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface LeadCardProps {
  id: string;
  title: string;
  source: string;
  location: string;
  projectType: string;
  value?: string | number;
  description?: string;
  createdAt: string | Date;
  isUnlocked?: boolean;
  status?: string;
  email?: string;
  phone?: string;
  lang?: Lang;
}

interface UnlockedContact {
  email?: string | null;
  phone?: string | null;
}

const LeadCard: React.FC<LeadCardProps> = ({
  id,
  title,
  source,
  location,
  projectType,
  value,
  description,
  createdAt,
  isUnlocked = false,
  email: initialEmail,
  phone: initialPhone,
  lang = "en",
}) => {
  const t = useTranslations(lang);
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [isInspecting, setIsInspecting] = useState(false);
  const [contact, setContact] = useState<UnlockedContact>({
    email: initialEmail,
    phone: initialPhone,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relativeTime =
    typeof createdAt === "string"
      ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
      : formatDistanceToNow(createdAt, { addSuffix: true });

  const handleUnlock = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (unlocked || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/leads/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "ALREADY_UNLOCKED") {
          setUnlocked(true);
          return;
        }
        if (data.error === "LIMIT_REACHED") {
          setError(
            lang === "en"
              ? `Monthly limit reached. Upgrade your plan to unlock more leads.`
              : `Limite mensuelle atteinte. Améliorez votre plan pour déverrouiller plus de leads.`
          );
          return;
        }
        setError(
          data.message ||
            (lang === "en"
              ? "Could not unlock lead. Please try again."
              : "Impossible de déverrouiller le lead. Veuillez réessayer.")
        );
        return;
      }

      setUnlocked(true);
      if (data.lead) {
        setContact({ email: data.lead.email, phone: data.lead.phone });
      }
    } catch {
      setError(
        lang === "en"
          ? "Network error. Please try again."
          : "Erreur réseau. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setIsInspecting(true)}
        className={cn(
          "group relative flex flex-col p-6 rounded-3xl border bg-card/60 backdrop-blur-xl transition-all duration-500 cursor-pointer overflow-hidden",
          "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
          unlocked ? "border-green-500/30" : "border-border/50"
        )}
      >
        {/* Visual Flair */}
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

        {/* Badge Row */}
        <div className="flex justify-between items-center mb-5 relative z-10">
          <span
            className={cn(
              "px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border",
              source === "Direct Request" || source === "Demande directe"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-blue-500/10 text-blue-500 border-blue-500/20"
            )}
          >
            {source}
          </span>
          <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-bold uppercase tracking-tight">
            <Clock size={12} />
            {relativeTime}
          </div>
        </div>

        {/* Title & Core Details */}
        <div className="flex-1 relative z-10">
          <h3 className="text-xl font-black mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-4 flex items-center gap-1">
             <TrendingUp size={10} className="text-amber-500" /> 
             {lang === "en" ? "Ready to Claim" : "Prêt à réclamer"}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex items-center gap-2 text-[11px] text-foreground/70 font-bold bg-muted/20 p-2 rounded-xl border border-border/50">
              <MapPin size={14} className="text-primary/60" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-foreground/70 font-bold bg-muted/20 p-2 rounded-xl border border-border/50">
              <Building2 size={14} className="text-primary/60" />
              <span className="capitalize truncate">{projectType}</span>
            </div>
          </div>

          {description && (
            <p className="text-muted-foreground/80 text-xs line-clamp-2 mb-5 italic leading-relaxed">
              &quot;{description}&quot;
            </p>
          )}

          {/* Value Indicator */}
          {value && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs font-black border border-green-500/10 mb-5">
              <DollarSign size={14} />
              <span>
                {typeof value === "number" ? `$${value.toLocaleString()}` : value}
              </span>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex flex-col gap-3 mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
              <div className="flex items-start gap-2 text-xs font-medium">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {error.includes(lang === "en" ? "limit reached" : "limite atteinte") && (
                <a 
                  href={`/${lang}/settings?tab=billing`}
                  onClick={(e) => e.stopPropagation()}
                  className="btn-outline-amber text-[10px] py-1.5 h-auto w-fit font-bold uppercase tracking-widest border-2"
                >
                  {lang === "en" ? "Upgrade Plan" : "Améliorer le plan"}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Private Data "Paywall" */}
        <div className="mt-auto pt-6 border-t border-border/30 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-widest">
                {t("dashboard.verifiedContact")}
              </span>
              {unlocked ? (
                <div className="flex flex-col gap-0.5 text-green-500 font-black animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-tighter">
                    <CheckCircle2 size={14} />
                    <span>{t("dashboard.unlocked")}</span>
                  </div>
                  {contact.phone && (
                    <span className="text-[11px] text-foreground font-mono">{contact.phone}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground/30">
                  <Lock size={12} />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    {t("dashboard.locked")}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleUnlock}
              disabled={loading || unlocked}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all duration-300 disabled:cursor-not-allowed uppercase tracking-widest",
                unlocked
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : loading
                  ? "bg-primary/40 text-white cursor-wait"
                  : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-95"
              )}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : unlocked ? (
                <>
                  <ChevronRight size={16} />
                </>
              ) : (
                <>
                  {t("dashboard.unlockLead")}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Intelligence Sheet */}
      <AnimatePresence>
        {isInspecting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 sm:p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInspecting(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-2xl h-full sm:h-[calc(100vh-40px)] bg-card border-l sm:border sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Sheet Header */}
              <div className="p-6 sm:p-8 border-b border-border/50 flex items-start justify-between bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <FileText size={24} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{t("marketplace.intel.title")}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="badge-amber text-[10px] px-2.5 py-1 font-black">{source}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      <Clock size={12} /> {relativeTime}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-green-500 tracking-widest italic animate-pulse">
                      <Zap size={12} /> {lang === "en" ? "Verified Live" : "Vérifié en direct"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsInspecting(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Sheet Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 custom-scrollbar">
                {/* Title & Summary */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t("marketplace.intel.summary")}</h3>
                  <div className="p-6 rounded-3xl bg-muted/30 border border-border/50 space-y-4">
                    <h1 className="text-2xl font-black leading-tight">{title}</h1>
                    <p className="text-foreground/80 leading-relaxed font-medium">
                      {description || (lang === "en" ? "No detailed description provided by the homeowner." : "Aucune description détaillée fournie par le propriétaire.")}
                    </p>
                  </div>
                </div>

                {/* Market Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t("marketplace.intel.location")}</h4>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <MapPin size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black">{location}</span>
                        <span className="text-xs text-muted-foreground font-bold">Canada</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t("marketplace.intel.scope")}</h4>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                        <Building2 size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black capitalize">{projectType}</span>
                        <span className="text-xs text-muted-foreground font-bold">{t("dashboard.verified")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t("marketplace.intel.value")}</h4>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                        <DollarSign size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-2xl font-black tabular-nums">
                           {typeof value === "number" ? `$${value.toLocaleString()}` : (value || "$5,000+")}
                        </span>
                        <span className="text-xs text-muted-foreground font-bold">{lang === "en" ? "Market Average" : "Moyenne du marché"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t("marketplace.intel.velocity")}</h4>
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <TrendingUp size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black uppercase italic tracking-tighter text-amber-500">Fast Action</span>
                        <span className="text-xs text-muted-foreground font-bold">{lang === "en" ? "High Priority" : "Priorité haute"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why Claim This? */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">In-Depth Market Analysis</h3>
                  <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-6">
                    <div className="flex items-start gap-3">
                      <div className="p-1 px-2 rounded-lg bg-green-500/20 text-green-500 text-[10px] font-black uppercase">Alpha</div>
                      <p className="text-xs font-bold leading-relaxed">
                        {lang === "en" 
                          ? "Our AI detected this property recently initiated structural planning. High probability of immediate technical requirements."
                          : "Notre IA a détecté que cette propriété a récemment lancé une planification structurelle. Forte probabilité de besoins techniques immédiats."
                        }
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-xs font-black text-foreground/70">
                        <ShieldCheck size={14} className="text-blue-500" />
                        {lang === "en" ? "Double-Verified" : "Doublement vérifié"}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black text-foreground/70">
                        <Zap size={14} className="text-amber-500" />
                        {lang === "en" ? "Exclusive Feed" : "Source exclusive"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Shield */}
                <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                   <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                      <Lock size={24} />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-amber-500/80 uppercase tracking-widest italic">{lang === "en" ? "Secure Intelligence" : "Intelligence Sécurisée"}</span>
                      <p className="text-xs text-muted-foreground font-medium leading-tight">
                        {t("marketplace.intel.warning")}
                      </p>
                   </div>
                </div>
              </div>

              {/* Sheet Footer */}
              <div className="p-6 sm:p-8 border-t border-border/50 bg-muted/20 backdrop-blur-xl">
                 <button 
                  onClick={handleUnlock}
                  disabled={loading || unlocked}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl tracking-tight uppercase",
                    unlocked
                      ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
                      : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-95 shadow-primary/30"
                  )}
                 >
                    {loading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : unlocked ? (
                      <>
                        <CheckCircle2 size={24} />
                        {t("dashboard.claimed")}
                      </>
                    ) : (
                      <>
                        <Zap size={22} fill="currentColor" />
                        {t("marketplace.intel.cta")}
                        <ChevronRight size={24} />
                      </>
                    )}
                 </button>
                 {!unlocked && (
                   <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                     <ShieldCheck size={12} />
                     100% Secure Transaction
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LeadCard;
