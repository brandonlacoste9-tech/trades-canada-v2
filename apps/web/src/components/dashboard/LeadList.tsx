"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Zap, CheckCircle, Clock, Phone, Mail } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

interface LeadListProps {
  leads: Lead[];
  marketLeads: Lead[];
  lang: Lang;
  userId: string;
}

const scoreColor = (score: number | null) => {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-amber-400";
  if (score >= 60) return "text-amber-500/80";
  return "text-muted-foreground";
};

const statusBadge = (status: string, lang: Lang) => {
  const map: Record<string, { label: { en: string; fr: string }; cls: string }> = {
    new: { label: { en: "New", fr: "Nouveau" }, cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    qualified: { label: { en: "Qualified", fr: "Qualifié" }, cls: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
    contacted: { label: { en: "Contacted", fr: "Contacté" }, cls: "bg-white/10 text-muted-foreground border-white/10" },
    converted: { label: { en: "Converted", fr: "Converti" }, cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    lost: { label: { en: "Lost", fr: "Perdu" }, cls: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const s = map[status] ?? map.new;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-display font-semibold border ${s.cls}`}>{s.label[lang]}</span>;
};

function LeadCard({ lead, lang, userId, isMarket }: { lead: Lead; lang: Lang; userId: string; isMarket: boolean }) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;
    await client
      .from("leads")
      .update({ contractor_id: userId, claimed_at: new Date().toISOString(), status: "qualified" })
      .eq("id", lead.id);
    setClaimed(true);
    setClaiming(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover cyber-border rounded-xl p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-display font-semibold text-sm text-foreground truncate">{lead.name}</span>
            {statusBadge(lead.status, lang)}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {lead.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500/60" />
                {lead.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(lead.created_at).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA")}
            </span>
            {lead.score && (
              <span className={`flex items-center gap-1 font-semibold ${scoreColor(lead.score)}`}>
                <Zap className="w-3 h-3" />
                {lead.score}
              </span>
            )}
          </div>
          {lead.message && (
            <p className="text-muted-foreground text-xs mt-2 line-clamp-2">{lead.message}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-display capitalize">
            {lead.project_type?.replace("_", " ")}
          </span>
          {isMarket && !claimed ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="btn-amber text-xs px-3 py-1.5"
            >
              {claiming ? (
                <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t("dashboard.claimLead", lang)}
                </>
              )}
            </button>
          ) : claimed ? (
            <span className="text-xs text-amber-400 font-display font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {t("dashboard.claimed", lang)}
            </span>
          ) : (
            <div className="flex gap-2">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:text-amber-400 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
              <a href={`mailto:${lead.email}`} className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:text-amber-400 transition-colors">
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function LeadList({ leads, marketLeads, lang, userId }: LeadListProps) {
  const [tab, setTab] = useState<"my" | "market">("my");

  const displayLeads = tab === "my" ? leads : marketLeads;

  return (
    <div className="glass-card cyber-border rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {(["my", "market"] as const).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={`flex-1 px-4 py-3.5 font-display text-sm font-semibold transition-all ${
              tab === t_
                ? "text-amber-400 border-b-2 border-amber-500 bg-amber-500/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t_ === "my"
              ? `${t("dashboard.leads", lang)} (${leads.length})`
              : `${lang === "en" ? "Market Leads" : "Leads du marché"} (${marketLeads.length})`}
          </button>
        ))}
      </div>

      {/* Lead list */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {displayLeads.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-sm text-center py-8"
            >
              {t("dashboard.noLeads", lang)}
            </motion.p>
          ) : (
            displayLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                lang={lang}
                userId={userId}
                isMarket={tab === "market"}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
