"use client";

import React, { useState, useEffect } from "react";
import LeadCard from "./LeadCard";
import { 
  Plus, 
  Search, 
  SlidersHorizontal,
  Building2,
  Zap,
  PipetteIcon as Pipe,
  TrendingUp,
  Award,
  Hammer,
  Leaf,
  HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lang, useTranslations } from "@/lib/i18n";

interface LeadData {
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
}

interface LeadMarketplaceProps {
  initialLeads?: LeadData[];
  lang: Lang;
}

const LeadMarketplace: React.FC<LeadMarketplaceProps> = ({ initialLeads = [], lang }) => {
  const t = useTranslations(lang);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    newToday: 0,
    leadsInNetwork: 0,
    pipelineScoreAvg: 0,
    premiumLeads: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/marketplace/stats");
        const data = await response.json();
        if (data && !data.error) {
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch marketplace stats", err);
      }
    }
    fetchStats();
  }, []);

  const leadsToDisplay = initialLeads;

  const filteredLeads = leadsToDisplay.filter(l => 
    (filter === "all" || l.projectType?.toLowerCase() === filter.toLowerCase()) &&
    (l.title.toLowerCase().includes(search.toLowerCase()) || (l.location || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            {t("marketplace.title")}
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg animate-pulse font-bold border border-primary/20">
              LIVE
            </span>
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("marketplace.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={t("marketplace.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-muted/20 border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-2 bg-muted/10 rounded-2xl border border-border/50">
        <div className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-xl font-bold">{stats.newToday}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("marketplace.stats.newToday")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 border-l border-border/20">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-xl font-bold">{stats.leadsInNetwork}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("marketplace.stats.leadsInNetwork")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 border-l border-border/20">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-xl font-bold">{stats.pipelineScoreAvg}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("marketplace.stats.avgLeadScore")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 border-l border-border/20">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Award size={20} />
          </div>
          <div>
            <div className="text-xl font-bold">{stats.premiumLeads}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("marketplace.stats.premiumLeads")}</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button 
          onClick={() => setFilter("all")}
          className={cn(
            "px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
            filter === "all" 
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          {t("marketplace.allCategories")}
        </button>
        <button 
          onClick={() => setFilter("plumbing")}
          className={cn(
             "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
            filter === "plumbing" 
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Pipe size={16} />
          {t("marketplace.plumbing")}
        </button>
        <button 
          onClick={() => setFilter("electrical")}
          className={cn(
             "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
            filter === "electrical" 
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Zap size={16} />
          {t("marketplace.electrical")}
        </button>
        <button 
          onClick={() => setFilter("hvac")}
          className={cn(
             "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
            filter === "hvac" 
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Building2 size={16} />
          {t("marketplace.hvac")}
        </button>
        <button 
          onClick={() => setFilter("roofing")}
          className={cn(
             "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
            filter === "roofing" 
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Hammer size={16} />
          {t("marketplace.roofing")}
        </button>
        <button 
          onClick={() => setFilter("landscaping")}
          className={cn(
             "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
            filter === "landscaping" 
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Leaf size={16} />
          {t("marketplace.landscaping")}
        </button>
        <button 
          onClick={() => setFilter("renovations")}
          className={cn(
             "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
            filter === "renovations" 
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
              : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
          )}
        >
          <HardHat size={16} />
          {t("marketplace.renovations")}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredLeads.map(lead => (
          <LeadCard key={lead.id} {...lead} lang={lang} />
        ))}
        
        {/* Empty State / Add Suggestion */}
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border bg-muted/5 group cursor-pointer hover:bg-muted/10 transition-colors">
          <div className="h-12 w-12 rounded-full border border-dashed border-primary/30 flex items-center justify-center text-primary/50 group-hover:text-primary transition-colors group-hover:scale-110 duration-300">
            <Plus size={24} />
          </div>
          <span className="mt-4 font-medium text-muted-foreground text-center">
            {t("marketplace.proposeSource")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LeadMarketplace;
