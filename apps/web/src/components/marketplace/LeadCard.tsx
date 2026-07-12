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
  User,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lang, useTranslations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

export type LeadKind = "form" | "permit" | "demo";

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
  name?: string;
  email?: string;
  phone?: string;
  url?: string;
  lang?: Lang;
  isMock?: boolean;
  /** form = homeowner contact; permit = open-data job signal; demo = free tier */
  leadKind?: LeadKind;
  permitNumber?: string | null;
  address?: string | null;
}

interface UnlockedContact {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  url?: string | null;
  message?: string | null;
  city?: string | null;
  project_type?: string | null;
  lead_kind?: LeadKind | null;
  address?: string | null;
  permit_number?: string | null;
  maps_url?: string | null;
}

function mapsSearchUrl(address?: string | null, location?: string | null): string | null {
  const q = [address, location].filter(Boolean).join(", ").trim();
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
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
  name: initialName,
  email: initialEmail,
  phone: initialPhone,
  url: initialUrl,
  lang = "en",
  isMock = false,
  leadKind: leadKindProp,
  permitNumber: initialPermit,
  address: initialAddress,
}) => {
  const t = useTranslations(lang);
  const inferredKind: LeadKind = isMock
    ? "demo"
    : leadKindProp ||
      (/permit|municipal|permis/i.test(source) ? "permit" : "form");
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [isInspecting, setIsInspecting] = useState(false);
  const [contact, setContact] = useState<UnlockedContact>({
    name: initialName,
    email: initialEmail,
    phone: initialPhone,
    url: initialUrl,
    address: initialAddress,
    permit_number: initialPermit,
    maps_url: mapsSearchUrl(initialAddress, location),
    lead_kind: inferredKind === "demo" ? null : inferredKind,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kind: LeadKind =
    contact.lead_kind === "permit" || contact.lead_kind === "form"
      ? contact.lead_kind
      : inferredKind;
  const isPermit = kind === "permit";
  const displayAddress = contact.address || initialAddress || location;
  const mapsHref =
    contact.maps_url || mapsSearchUrl(contact.address || initialAddress, location);

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

    if (isMock) {
      setError(
        lang === "en"
          ? "This is a demo lead. Subscribe to a paid plan to unlock real leads."
          : "Ceci est un lead démo. Abonnez-vous à un plan payant pour débloquer de vrais leads."
      );
      return;
    }

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
          if (data.lead) {
            setContact({
              name: data.lead.name,
              email: data.lead.email,
              phone: data.lead.phone,
              url: data.lead.url,
              message: data.lead.message,
              city: data.lead.city,
              project_type: data.lead.project_type,
              lead_kind: data.lead.lead_kind,
              address: data.lead.address,
              permit_number: data.lead.permit_number,
              maps_url: data.lead.maps_url,
            });
          }
          return;
        }
        if (data.error === "LIMIT_REACHED") {
          setError(
            lang === "en"
              ? "Monthly limit reached. Upgrade your plan to unlock more leads."
              : "Limite mensuelle atteinte. Améliorez votre plan pour déverrouiller plus de leads."
          );
          return;
        }
        if (data.error === "UPGRADE_REQUIRED") {
          setError(
            data.message ||
              (lang === "en"
                ? "Subscribe to a paid plan to unlock real leads."
                : "Abonnez-vous pour débloquer de vrais leads.")
          );
          return;
        }
        setError(
          data.message ||
            data.error ||
            (lang === "en" ? "Could not unlock lead." : "Impossible de déverrouiller.")
        );
        return;
      }

      setUnlocked(true);
      if (data.lead) {
        setContact({
          name: data.lead.name,
          email: data.lead.email,
          phone: data.lead.phone,
          url: data.lead.url,
          message: data.lead.message,
          city: data.lead.city,
          project_type: data.lead.project_type,
          lead_kind: data.lead.lead_kind,
          address: data.lead.address,
          permit_number: data.lead.permit_number,
          maps_url: data.lead.maps_url,
        });
      }
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
            {/* Honest product type badge */}
            {kind === "form" && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-black border border-emerald-500/25 uppercase tracking-widest">
                <Phone size={10} /> {lang === "en" ? "Homeowner contact" : "Contact propriétaire"}
              </span>
            )}
            {kind === "permit" && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 text-sky-400 text-[10px] font-black border border-sky-500/25 uppercase tracking-widest">
                <FileText size={10} /> {lang === "en" ? "Permit signal" : "Signal permis"}
              </span>
            )}
            {kind === "demo" && (
              <span className="px-2 py-1 rounded-lg bg-muted/40 text-muted-foreground text-[10px] font-black border border-border uppercase tracking-widest">
                Demo
              </span>
            )}
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
              <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-bold">
                <MapPin size={12} className="text-primary/50 shrink-0" />
                <span className="break-words w-full">{location}</span>
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
          {/* Locked / unlocked preview */}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-[9px] text-muted-foreground/50 uppercase font-black tracking-widest">
              {isPermit
                ? lang === "en"
                  ? "Job-site intel"
                  : "Intel chantier"
                : t("dashboard.verifiedContact")}
            </span>
            {unlocked ? (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-1 max-w-[min(100%,320px)]">
                {contact.name && !isPermit && (
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <User size={14} className="text-primary shrink-0" />
                    <span className="truncate">{contact.name}</span>
                  </span>
                )}
                {/* Always show street/city — primary value for permits */}
                <span className="flex items-center gap-1.5 text-xs text-foreground/90 font-medium">
                  <MapPin size={12} className="text-primary/70 shrink-0" />
                  <span className="line-clamp-2">{displayAddress}</span>
                </span>
                {(contact.permit_number || initialPermit) && (
                  <span className="text-[10px] font-mono text-sky-400 font-bold">
                    #{contact.permit_number || initialPermit}
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {contact.phone &&
                    !String(contact.phone).includes("open data") &&
                    contact.phone !== "[Requires Elite Upgrade]" && (
                      <a
                        href={`tel:${contact.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs font-mono text-green-500 font-bold bg-green-500/5 px-2 py-1 rounded-lg border border-green-500/10 hover:bg-green-500/10"
                      >
                        <Phone size={12} /> {contact.phone}
                      </a>
                    )}
                  {contact.email &&
                    !contact.email.includes("@scraped.") &&
                    !contact.email.includes("open data") &&
                    contact.email !== "[Requires Elite Upgrade]" && (
                      <a
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs font-mono text-blue-500 font-bold bg-blue-500/5 px-2 py-1 rounded-lg border border-blue-500/10 truncate max-w-[200px] hover:bg-blue-500/10"
                      >
                        <Mail size={12} /> {contact.email}
                      </a>
                    )}
                  {mapsHref && (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/20 hover:bg-sky-500/15"
                    >
                      <MapPin size={12} />
                      {lang === "en" ? "Maps" : "Cartes"}
                    </a>
                  )}
                </div>
                {isPermit && !contact.phone && !contact.email && (
                  <span className="text-[10px] text-muted-foreground leading-snug">
                    {lang === "en"
                      ? "Open data: address & scope only — no owner phone in city files. Door-knock / flyer from Maps."
                      : "Données ouvertes: adresse et portée seulement — pas de téléphone. Porte-à-porte via Cartes."}
                  </span>
                )}
                {contact.url && (
                  <a
                    href={contact.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />{" "}
                    {lang === "en" ? "City permit record" : "Dossier permis municipal"}
                  </a>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground/40">
                  <Lock size={11} />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    {isPermit
                      ? lang === "en"
                        ? "Unlock address & permit #"
                        : "Débloquer adresse et n° permis"
                      : t("dashboard.locked")}
                  </span>
                </div>
                {!isPermit && !isMock && (
                  <span className="text-[10px] text-emerald-500/70 font-medium">
                    {lang === "en" ? "Includes name, phone & email" : "Inclut nom, téléphone et courriel"}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
              <Eye size={12} />
              {lang === "en" ? "View Details" : "Voir détails"}
            </span>

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
                  {lang === "en" ? "Unlocked" : "Déverrouillé"}
                </>
              ) : (
                <>
                  {isPermit
                    ? lang === "en"
                      ? "Unlock intel"
                      : "Débloquer intel"
                    : t("dashboard.unlockLead")}
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
            {(error.includes("limit") || error.includes("UPGRADE")) && (
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
                    <span
                      className={cn(
                        "px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest",
                        isPermit
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : kind === "form"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-muted/30 border-border text-muted-foreground"
                      )}
                    >
                      {isPermit
                        ? lang === "en"
                          ? "Permit signal"
                          : "Signal permis"
                        : kind === "form"
                          ? lang === "en"
                            ? "Homeowner contact"
                            : "Contact propriétaire"
                          : source}
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
                    <p className="text-foreground/75 leading-relaxed text-sm whitespace-pre-line">
                      {description ||
                        (isPermit
                          ? lang === "en"
                            ? "Municipal open-data job signal. Unlock for full address, permit number, and Maps link. City files do not include owner phone."
                            : "Signal de travaux (données ouvertes). Débloquez pour l'adresse, le n° de permis et Cartes. Les fichiers municipaux n'incluent pas le téléphone."
                          : lang === "en"
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
                      <span className="font-black text-base line-clamp-2">{displayAddress}</span>
                    </div>
                    {mapsHref ? (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-sky-400 font-bold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lang === "en" ? "Open in Google Maps →" : "Ouvrir dans Google Maps →"}
                      </a>
                    ) : (
                      <p className="text-[10px] text-muted-foreground font-medium">Canada</p>
                    )}
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

                {/* Unlocked intel / contact */}
                {unlocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-6 rounded-2xl border space-y-4",
                      isPermit
                        ? "bg-sky-500/8 border-sky-500/25"
                        : "bg-green-500/8 border-green-500/25"
                    )}
                  >
                    <p
                      className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2",
                        isPermit ? "text-sky-400" : "text-green-400"
                      )}
                    >
                      <CheckCircle2 size={13} />
                      {isPermit
                        ? lang === "en"
                          ? "Permit intel unlocked"
                          : "Intel permis débloqué"
                        : lang === "en"
                          ? "Homeowner contact unlocked"
                          : "Contact propriétaire débloqué"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(contact.address || displayAddress) && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-background/40 border border-border/40 sm:col-span-2">
                          <MapPin size={18} className="text-sky-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-widest font-black text-muted-foreground">
                              {lang === "en" ? "Address" : "Adresse"}
                            </p>
                            <p className="font-bold text-sm text-foreground break-words">
                              {contact.address || displayAddress}
                            </p>
                            {mapsHref && (
                              <a
                                href={mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-sky-400 hover:underline"
                              >
                                <ExternalLink size={12} />
                                {lang === "en" ? "Navigate in Google Maps" : "Naviguer dans Google Maps"}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      {(contact.permit_number || initialPermit) && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                          <FileText size={18} className="text-sky-400" />
                          <div>
                            <p className="text-[9px] uppercase tracking-widest font-black text-sky-400/60">
                              {lang === "en" ? "Permit #" : "Permis #"}
                            </p>
                            <p className="font-mono font-bold text-sm">
                              {contact.permit_number || initialPermit}
                            </p>
                          </div>
                        </div>
                      )}
                      {contact.name && !isPermit && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                          <User size={18} className="text-green-400" />
                          <div>
                            <p className="text-[9px] uppercase tracking-widest font-black text-green-400/60">Name</p>
                            <p className="font-mono font-bold text-sm text-foreground">{contact.name}</p>
                          </div>
                        </div>
                      )}
                      {contact.phone &&
                        contact.phone !== "[Requires Elite Upgrade]" &&
                        !String(contact.phone).includes("open data") && (
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
                      {contact.email &&
                        !contact.email.includes("@scraped.") &&
                        !contact.email.includes("open data") &&
                        contact.email !== "[Requires Elite Upgrade]" && (
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
                      {contact.url && (
                        <a
                          href={contact.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
                        >
                          <ExternalLink size={18} className="text-blue-400" />
                          <div>
                            <p className="text-[9px] uppercase tracking-widest font-black text-blue-400/60">Source</p>
                            <p className="font-mono font-bold text-sm truncate">
                              {lang === "en" ? "Municipal record" : "Dossier municipal"}
                            </p>
                          </div>
                        </a>
                      )}
                    </div>
                    {isPermit && !contact.phone && (
                      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                        {lang === "en"
                          ? "City open data does not include the property owner's phone. Use address + Maps for door-knock / flyer outreach, or wait for a Homeowner contact lead for callable PII."
                          : "Les données ouvertes n'incluent pas le téléphone du propriétaire. Utilisez l'adresse + Cartes pour le porte-à-porte, ou un lead Contact propriétaire pour le numéro."}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* AI Victory Plan — Elite Exclusive */}
                {unlocked && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Zap size={60} className="text-amber-500" />
                    </div>
                    
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2">
                      <Zap size={13} fill="currentColor" />
                      {lang === "en" ? "Deep Intelligence: Victory Plan" : "Intelligence Profonde: Plan de Victoire"}
                    </p>

                    <div className="space-y-4 relative z-10">
                      <div>
                         <p className="text-xs font-bold text-foreground mb-1 italic">
                           {lang === "en" ? "Economic Opportunity" : "Opportunité Économique"}
                         </p>
                         <p className="text-sm text-muted-foreground leading-relaxed">
                            {lang === "en" 
                              ? "Targeting a ~15-20% margin enhancement by bundling localized supply chain data with this property's specific permit profile."
                              : "Ciblage d'une amélioration de marge de ~15-20% en regroupant les données de la chaîne d'approvisionnement locale avec le profil de permis spécifique de cette propriété."}
                         </p>
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                         <p className="text-[10px] uppercase font-black text-amber-400/60 mb-2">
                           {lang === "en" ? "AI Strategic Advice" : "Conseil Stratégique IA"}
                         </p>
                         <p className="text-sm font-medium text-foreground leading-relaxed">
                           {lang === "en"
                             ? "Be the first to mention the municipal planning update (Permit pending). Emphasize reliability and immediate crew availability to secure the contract before competitors finish their research."
                             : "Soyez le premier à mentionner la mise à jour de la planification municipale (permis en attente). Mettez l'accent sur la fiabilité et la disponibilité immédiate de l'équipe pour décrocher le contrat avant que les concurrents n'aient terminé leurs recherches."}
                         </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-500/10">
                       <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/50">
                         Powered by Trades-Canada AI Engine v4.0
                       </span>
                       <div className="flex -space-x-1">
                          {[1,2,3].map(i => (
                            <div key={i} className="h-5 w-5 rounded-full border-2 border-card bg-amber-500/20 flex items-center justify-center">
                               <ShieldCheck size={10} className="text-amber-500" />
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                )}

                {/* Privacy notice — only while locked */}
                {!unlocked && (
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
                )}

                {/* Inline error if any */}
                {error && (
                  <div className="flex flex-col gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <div className="flex items-start gap-2 text-xs font-medium">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                    {(error.includes("limit") || error.includes("UPGRADE")) && (
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
                      {isPermit
                        ? lang === "en"
                          ? "Unlock address & permit"
                          : "Débloquer adresse et permis"
                        : t("marketplace.intel.cta")}
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
