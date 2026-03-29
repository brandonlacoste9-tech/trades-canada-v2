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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lang, useTranslations } from "@/lib/i18n";

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

  const handleUnlock = async () => {
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
          // Treat as success — just show contact
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
    <div
      className={cn(
        "group relative flex flex-col p-6 rounded-2xl border bg-card/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5",
        unlocked ? "border-green-500/30" : "border-border"
      )}
    >
      {/* Badge Row */}
      <div className="flex justify-between items-center mb-4">
        <span
          className={cn(
            "px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider",
            source === "Direct Request" || source === "Demande directe"
              ? "bg-amber-100/10 text-amber-500"
              : "bg-blue-100/10 text-blue-500"
          )}
        >
          {source}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Clock size={14} />
          {relativeTime}
        </div>
      </div>

      {/* Title & Core Details */}
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-2 line-clamp-1">{title}</h3>

        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
            <MapPin size={16} className="text-primary" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
            <Building2 size={16} className="text-primary" />
            <span className="capitalize">{projectType}</span>
          </div>
          {value && (
            <div className="flex items-center gap-2 text-sm text-green-500/80 font-medium">
              <DollarSign size={16} />
              <span>
                {typeof value === "number" ? `$${value.toLocaleString()}` : value}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-primary/80 font-medium">
            <ShieldCheck size={16} />
            <span>{t("dashboard.verified")}</span>
          </div>
        </div>

        {description && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4 bg-muted/30 p-3 rounded-lg border border-dashed border-border/10">
            {description}
          </p>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Private Data "Paywall" */}
      <div className="mt-auto pt-6 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter">
              {t("dashboard.verifiedContact")}
            </span>
            {unlocked ? (
              <div className="flex flex-col gap-1 text-green-500 font-medium animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{t("dashboard.unlocked")}</span>
                </div>
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-xs text-foreground/80 font-mono hover:underline"
                  >
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-xs text-foreground/80 font-mono hover:underline"
                  >
                    {contact.phone}
                  </a>
                )}
              </div>
            ) : (
              <div className="relative overflow-hidden w-24 h-6 rounded flex items-center">
                <div className="absolute inset-0 bg-muted/50 blur-[4px] blur-mask" />
                <span className="relative z-10 text-[10px] text-muted-foreground/50 tracking-widest pl-2 uppercase font-black">
                  {t("dashboard.locked")}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card/10 to-transparent animate-shimmer" />
              </div>
            )}
          </div>

          <button
            onClick={handleUnlock}
            disabled={loading || unlocked}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 disabled:cursor-not-allowed",
              unlocked
                ? "bg-green-500/10 text-green-500"
                : loading
                ? "bg-primary/60 text-white"
                : "bg-primary text-white hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {lang === "en" ? "Unlocking…" : "Déverrouillage…"}
              </>
            ) : unlocked ? (
              <>
                {t("dashboard.viewDetails")}
                <ChevronRight size={18} />
              </>
            ) : (
              <>
                {t("dashboard.unlockLead")}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unlock Indicator */}
      {!unlocked && (
        <div className="absolute top-2 right-2 p-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
          <Lock size={16} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default LeadCard;
