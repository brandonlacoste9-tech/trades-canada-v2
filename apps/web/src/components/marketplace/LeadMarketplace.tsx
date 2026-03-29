"use client";

import React, { useState } from "react";
import LeadCard from "./LeadCard";
import { 
  Plus, 
  Search, 
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Zap,
  PipetteIcon as Pipe,
  TrendingUp,
  Award,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lang, useTranslations } from "@/lib/i18n";

// Mock Data representing both scraped permits and direct leads
const MOCK_LEADS = [
  {
    id: "lead-1",
    title: "Full Home Plumbing Overhaul",
    source: "Direct Request",
    location: "Toronto, ON",
    projectType: "plumbing",
    value: "$4,500 - $6,000",
    description: "Homeowner looking for a full replacement of aging copper piping with PEX. Requires permit handling and inspection support.",
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    isUnlocked: true
  },
  {
    id: "sc-1",
    title: "Commercial Electrical Permit",
    source: "Municipal Data",
    location: "Montreal, QC",
    projectType: "electrical",
    value: "$12,300 (Est.)",
    description: "New commercial unit buildup. Lighting, power distribution, and data cabling required for 2,500 sq ft office space.",
    createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    isUnlocked: false
  },
  {
    id: "sc-2",
    title: "Residential HVAC Install",
    source: "Municipal Data",
    location: "Vancouver, BC",
    projectType: "hvac",
    value: "$8,500 (Est.)",
    description: "Heat pump installation permit on a detached residential property. Multi-zone system installation pending.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    isUnlocked: false
  },
  {
    id: "lead-2",
    title: "Emergency Panel Upgrade",
    source: "Direct Request",
    location: "Halifax, NS",
    projectType: "electrical",
    value: "$2,800",
    description: "Customer reported flickering lights and burnt smell from main 100A panel. Urgent replacement to 200A required.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    isUnlocked: false
  }
];

interface LeadMarketplaceProps {
  initialLeads?: any[];
  lang: Lang;
}

const LeadMarketplace: React.FC<LeadMarketplaceProps> = ({ initialLeads = [], lang }) => {
  const t = useTranslations(lang);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const leadsToDisplay = initialLeads.length > 0 ? initialLeads : MOCK_LEADS;

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
            <div className="text-xl font-bold">164</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("marketplace.stats.newToday")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 border-l border-border/20">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-xl font-bold">$1.2M</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("marketplace.stats.totalMarket")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 border-l border-border/20">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-xl font-bold">12s</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("marketplace.stats.quickUnlock")}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 border-l border-border/20">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Award size={20} />
          </div>
          <div>
            <div className="text-xl font-bold">142</div>
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
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
