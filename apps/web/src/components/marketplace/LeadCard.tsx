"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  TrendingUp,
  X,
  FileText,
  Zap,
  ChevronRight,
  Phone,
  Mail,
  Eye,
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

const projectTypeColor: Record<string, string> = {
  plumbing:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  electrical:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  hvac:        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  roofing:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
  landscaping: "bg-green-500/10 text-green-400 border-green-500/20",
  renovations: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  general:     "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

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

  const typeColorClass =
    projectTypeColor[projectType?.toLowerCase()] ??
    "bg-primary/10 text-primary border-primary/20";

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
        if (data.error === "ALREADY_UNLOCKED") { setUnlocked(true); return; }
        if (data.error === "LIMIT_REACHED") {
          setError(
            lang === "en"
              ? "Monthly limit reached. Upgrade your plan to unlock more leads."
              : "Limite mensuelle atteinte. Améliorez votre plan pour déverrouiller plus de leads."
          );
          return;
        }
        setError(data.message || (lang === "en" ? "Could not unlock lead." : "Impossible de déverrouiller."));
        return;
      }

      setUnlocked(true);
      if (data.lead) setContact({ email: data.lead.email, phone: data.lead.phone });
    } catch {
      setError(lang === "en" ? "Network error. Please try again." : "Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <motion.div
        layout
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={() => setIsInspecting(true)}
        className={cn(
          "group relative flex flex-col rounded-3xl border bg-card/60 backdrop-blur-xl cursor-pointer overflow-hidden transition-shadow duration-300",
          "hover:shadow-2xl hover:shadow-primary/10",
          unlocked ? "border-green-500/30" : "border-border/50 hover:border-primary/40"
        )}
      >
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 h-48 w-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border", typeColorClass)}>
              {projectType}
            </span>
            {unlocked && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-black border border-green-500/20 uppercase tracking-widest">
                <CheckCircle2 size={10} /> {lang === "en" ? "Unlocked" : "Déverrouillé"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground/60 text-[10px] font-bold uppercase tracking-tight shrink-0">
            <Clock size={11} />
            {relativeTime}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col sm:flex-row gap-6 p-6 relative z-10">

          {/* Left: project type icon block */}
          <div className={cn(
            "hidden sm:flex h-16 w-16 shrink-0 rounded-2xl items-center justify-center border text-2xl font-black",
            typeColorClass
          )}>
            <Building2 size={28} />
          </div>

          {/* Right: content */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors line-clamp-1">
                {title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-bold">
                <MapPin size={12} className="text-primary/50 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>

            {description && (
              <p className="text-muted-foreground/80 text-sm line-clamp-2 italic leading-relaxed">
                &quot;{description}&quot;
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap pt-1">
              {/* Source badge */}
              <span className="px-2.5 py-1 rounded-lg bg-muted/30 border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {source}
              </span>

              {/* Value */}
              {value && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-black border border-green-500/20">
                  <DollarSign size={11} />
                  {typeof value === "number" ? `$${value.toLocaleString()}` : value}
                </span>
              )}

              {/* Priority */}
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-black border border-amber-500/20">
                <TrendingUp size={11} />
                {lang === "en" ? "High Priority" : "Priorité haute"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-4 relative z-10">
          {/* Locked / unlocked contact preview */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground/50 uppercase font-black tracking-widest">
              {t("dashboard.verifiedContact")}
            </span>
            {unlocked ? (
              <div className="flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-1">
                {contact.phone && (
                  <span className="flex items-center gap-1 text-xs font-mono text-green-400 font-bold">
                    <Phone size={11} /> {contact.phone}
                  </span>
                )}
                {contact.email && (
                  <span className="flex items-center gap-1 text-xs font-mono text-green-400 font-bold">
                    <Mail size={11} /> {contact.email}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground/30">
                <Lock size={11} />
                <span className="text-[10px] font-black tracking-widest uppercase">{t("dashboard.locked")}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Click-to-view hint */}
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
              <Eye size={12} />
              {lang === "en" ? "View Details" : "Voir détails"}
            </span>

            {/* Unlock button */}
            <button
              onClick={handleUnlock}
              disabled={loading || unlocked}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all duration-300 disabled:cursor-not-allowed uppercase tracking-widest shadow-lg",
                unlocked
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : loading
                  ? "bg-primary/40 text-white cursor-wait"
                  : "bg-primary text-white hover:bg-primary/90 shadow-primary/20 active:scale-95"
              )}
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : unlocked ? (
                <>
                  <CheckCircle2 size={13} />
                  {lang === "en" ? "Claimed" : "Réclamé"}
                </>
              ) : (
                <>
                  {t("dashboard.unlockLead")}
                  <ChevronRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mb-6 flex flex-col gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 relative z-10">
            <div className="flex items-start gap-2 text-xs font-medium">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {error.includes("limit") && (
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
      </motion.div>

      {/* ── Full Detail Drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isInspecting && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInspecting(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-2xl h-[92vh] sm:h-[calc(100vh-48px)] bg-card border-t sm:border sm:rounded-3xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
            >
              {/* ── Drawer Header ── */}
              <div className="p-6 sm:p-8 border-b border-border/50 flex items-start justify-between bg-gradient-to-br from-primary/8 via-transparent to-transparent shrink-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                        {t("marketplace.intel.title")}
                      </h2>
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-green-500 tracking-widest italic animate-pulse">
                        <Zap size={10} /> {lang === "en" ? "Verified Live" : "Vérifié en direct"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn("px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border", typeColorClass)}>
                      {projectType}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-muted/30 border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {source}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      <Clock size={11} /> {relativeTime}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsInspecting(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
                >
                  <X size={22} />
                </button>
              </div>

              {/* ── Drawer Body ── */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">

                {/* Title & Summary */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {t("marketplace.intel.summary")}
                  </p>
                  <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
                    <h1 className="text-2xl font-black leading-tight">{title}</h1>
                    <p className="text-foreground/75 leading-relaxed text-sm">
                      {description ||
                        (lang === "en"
                          ? "No detailed description provided. Contact the homeowner directly after unlocking."
                          : "Aucune description fournie. Contactez le propriétaire après déverrouillage.")}
                    </p>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-muted/10 border border-border/50 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {t("marketplace.intel.location")}
                    </p>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-blue-400 shrink-0" />
                      <span className="font-black text-base truncate">{location}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">Canada</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/10 border border-border/50 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {t("marketplace.intel.scope")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-purple-400 shrink-0" />
                      <span className="font-black text-base capitalize truncate">{projectType}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">{t("dashboard.verified")}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/10 border border-border/50 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {t("marketplace.intel.value")}
                    </p>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-400 shrink-0" />
                      <span className="font-black text-xl tabular-nums">
                        {typeof value === "number" ? `$${value.toLocaleString()}` : value || "$5,000+"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {lang === "en" ? "Market Average" : "Moyenne du marché"}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/10 border border-border/50 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {t("marketplace.intel.velocity")}
                    </p>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-amber-400 shrink-0" />
                      <span className="font-black text-base text-amber-400 uppercase italic">Fast Action</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {lang === "en" ? "High Priority" : "Priorité haute"}
                    </p>
                  </div>
                </div>

                {/* Contact preview — shown after unlock */}
                {unlocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-green-500/8 border border-green-500/25 space-y-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400 flex items-center gap-2">
                      <CheckCircle2 size={13} />
                      {lang === "en" ? "Contact Unlocked" : "Contact Déverrouillé"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors"
                        >
                          <Phone size={18} className="text-green-400" />
                          <div>
                            <p className="text-[9px] uppercase tracking-widest font-black text-green-400/60">Phone</p>
                            <p className="font-mono font-bold text-sm">{contact.phone}</p>
                          </div>
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors"
                        >
                          <Mail size={18} className="text-green-400" />
                          <div>
                            <p className="text-[9px] uppercase tracking-widest font-black text-green-400/60">Email</p>
                            <p className="font-mono font-bold text-sm truncate">{contact.email}</p>
                          </div>
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Intel box */}
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {lang === "en" ? "AI Market Analysis" : "Analyse de Marché IA"}
                  </p>
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[9px] font-black uppercase shrink-0 mt-0.5">Alpha</span>
                    <p className="text-sm text-foreground/75 leading-relaxed font-medium">
                      {lang === "en"
                        ? "Our AI detected this property recently initiated structural planning. High probability of immediate technical requirements."
                        : "Notre IA a détecté que cette propriété a récemment lancé une planification structurelle. Forte probabilité de besoins techniques immédiats."}
                    </p>
                  </div>
                  <div className="flex items-center gap-5 pt-1">
                    <span className="flex items-center gap-1.5 text-xs font-black text-foreground/70">
                      <ShieldCheck size={13} className="text-blue-400" />
                      {lang === "en" ? "Double-Verified" : "Doublement vérifié"}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-black text-foreground/70">
                      <Zap size={13} className="text-amber-400" />
                      {lang === "en" ? "Exclusive Feed" : "Source exclusive"}
                    </span>
                  </div>
                </div>

                {/* Privacy notice */}
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-400/80 uppercase tracking-widest italic mb-0.5">
                      {lang === "en" ? "Secure Intelligence" : "Intelligence Sécurisée"}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium leading-snug">
                      {t("marketplace.intel.warning")}
                    </p>
                  </div>
                </div>

                {/* Inline error if any */}
                {error && (
                  <div className="flex flex-col gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <div className="flex items-start gap-2 text-xs font-medium">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                    {error.includes("limit") && (
                      <a
                        href={`/${lang}/settings?tab=billing`}
                        className="btn-outline-amber text-[10px] py-1.5 h-auto w-fit font-bold uppercase tracking-widest border-2"
                      >
                        {lang === "en" ? "Upgrade Plan" : "Améliorer le plan"}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* ── Drawer Footer / CTA ── */}
              <div className="p-6 sm:p-8 border-t border-border/50 bg-muted/10 backdrop-blur-xl shrink-0">
                <button
                  onClick={handleUnlock}
                  disabled={loading || unlocked}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl tracking-tight uppercase",
                    unlocked
                      ? "bg-green-500/10 text-green-500 border border-green-500/25 cursor-default"
                      : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-95 shadow-primary/25"
                  )}
                >
                  {loading ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : unlocked ? (
                    <>
                      <CheckCircle2 size={22} />
                      {t("dashboard.claimed")}
                    </>
                  ) : (
                    <>
                      <Zap size={20} fill="currentColor" />
                      {t("marketplace.intel.cta")}
                      <ChevronRight size={22} />
                    </>
                  )}
                </button>
                {!unlocked && (
                  <p className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center justify-center gap-1.5">
                    <ShieldCheck size={11} />
                    {lang === "en" ? "100% Secure Transaction" : "Transaction 100% Sécurisée"}
                  </p>
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
