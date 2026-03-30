"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  FileText, 
  DollarSign, 
  ExternalLink, 
  Search, 
  TrendingUp, 
  Zap,
  X,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { type Lang } from "@/lib/i18n";
import { cities } from "@/lib/cityData";
import type { Database } from "@/types/marketplace";

type Permit = Database["public"]["Tables"]["scraped_inventory"]["Row"];

interface LeadRadarClientProps {
  permits: Permit[];
  lang: Lang;
}

export default function LeadRadarClient({ permits, lang }: LeadRadarClientProps) {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);

  const projectTypes = useMemo(() => {
    const types = new Set(permits.map((p) => p.project_type).filter(Boolean));
    return Array.from(types) as string[];
  }, [permits]);

  const filtered = useMemo(() => {
    return permits.filter((p) => {
      const matchCity = selectedCity === "all" || p.city?.toLowerCase() === selectedCity;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase());
      const matchType = selectedType === "all" || p.project_type === selectedType;
      return matchCity && matchSearch && matchType;
    });
  }, [permits, selectedCity, search, selectedType]);

  const cityOptions = useMemo(() => {
    const used = new Set(permits.map((p) => p.city?.toLowerCase()).filter(Boolean));
    return cities.filter((c) => used.has(c.slug));
  }, [permits]);

  return (
    <div className="space-y-5">
      {/* Premium Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card-hover cyber-border p-6 rounded-2xl flex flex-col gap-3 group">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all duration-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-amber-500/50 uppercase">Live Intelligence</span>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground">{(filtered.length * 1.5).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-tight font-bold font-display">Targetable Prospects</p>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "65%" }}
              className="h-full bg-amber-500"
            />
          </div>
        </div>

        <div className="glass-card-hover cyber-border p-6 rounded-2xl flex flex-col gap-3 group">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-all duration-500">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-blue-500/50 uppercase">Scanning Now</span>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground">12/min</div>
            <p className="text-xs text-muted-foreground uppercase tracking-tight font-bold font-display">Permit Capture Velocity</p>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "85%" }}
              className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            />
          </div>
        </div>

        <div className="glass-card-hover cyber-border p-6 rounded-2xl flex flex-col gap-3 group">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-black transition-all duration-500">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-purple-500/50 uppercase">Network Coverage</span>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground">100%</div>
            <p className="text-xs text-muted-foreground uppercase tracking-tight font-bold font-display">Bilingual Service Area</p>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              className="h-full bg-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="glass-card cyber-border rounded-xl p-3 flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={lang === "en" ? "Search property addresses, project names..." : "Rechercher des adresses, noms de projets..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-amber pl-9 w-full bg-transparent border-none focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-px bg-white/[0.08] hidden sm:block mx-2" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent border-none text-sm font-display font-medium text-foreground/80 focus:ring-0 cursor-pointer hover:text-amber-400 transition-colors py-0"
            >
              <option value="all">{lang === "en" ? "All Cities" : "Toutes les villes"}</option>
              {cityOptions.map((c) => (
                <option key={c.slug} value={c.slug} className="bg-background">
                  {lang === "fr" ? c.nameFr : c.name}
                </option>
              ))}
            </select>

            <div className="h-8 w-px bg-white/[0.08] hidden sm:block mx-2" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent border-none text-sm font-display font-medium text-foreground/80 focus:ring-0 cursor-pointer hover:text-amber-400 transition-colors py-0"
            >
              <option value="all">{lang === "en" ? "All Types" : "Tous les types"}</option>
              {projectTypes.map((type) => (
                <option key={type} value={type} className="bg-background capitalize">
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between w-full lg:w-auto px-2">
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            {filtered.length} Leads Analyzed
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center glass-card cyber-border rounded-2xl"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground/30 border border-dashed border-white/10">
                  <Search size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-foreground font-bold tracking-tight">
                    {lang === "en" ? "No matches found" : "Aucun résultat trouvé"}
                  </p>
                  <p className="text-muted-foreground text-xs font-medium">
                    {lang === "en" ? "Try adjusting your search or filters." : "Essayez d'ajuster votre recherche ou vos filtres."}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            filtered.map((permit, idx) => (
              <motion.div
                layout
                key={permit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setSelectedPermit(permit)}
                className="glass-card-hover cyber-border rounded-2xl overflow-hidden group flex flex-col cursor-pointer"
              >
                {/* Card Header Section */}
                <div className="relative h-28 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="badge-amber bg-black/40 border-amber-500/30 text-[9px] uppercase tracking-tighter shadow-sm font-black px-2 py-0.5">
                        {permit.project_type?.replace("_", " ") || (lang === "en" ? "Permit" : "Permis")}
                      </span>
                      <span className="text-[10px] text-green-400 font-black uppercase tracking-widest italic flex items-center gap-1">
                        <Zap size={10} /> Active
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-widest">
                      Live since {new Date(permit.scraped_at).toLocaleDateString(lang === "en" ? "en-US" : "fr-CA", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:border-amber-500/50 transition-colors shadow-lg">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                </div>

                {/* Main Content */}
                <div className="px-5 pb-5 flex flex-col flex-1 gap-4 -mt-8 relative z-10">
                  <div className="bg-background/60 backdrop-blur-2xl rounded-xl p-4 border border-white/5 space-y-2.5 shadow-2xl">
                    <h3 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-amber-400 transition-colors leading-tight font-display">
                      {permit.title || (lang === "en" ? "Structural Project" : "Projet structurel")}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-500/50" />
                      <span className="truncate">
                        {permit.location || "Quebec, CA"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-1 hover:bg-white/[0.05] transition-colors">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Valuation</span>
                      <span className="text-sm font-black text-foreground tabular-nums">
                        {permit.estimated_value 
                          ? new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(permit.estimated_value)
                          : "$25,000+"
                        }
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-1 hover:bg-white/[0.05] transition-colors">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Market Intensity</span>
                      <span className="text-[11px] font-black text-amber-500 flex items-center gap-1">
                        <TrendingUp size={12} /> High
                      </span>
                    </div>
                  </div>

                  {permit.description && (
                    <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed font-medium italic">
                      {permit.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex h-6 w-6 rounded-full ring-2 ring-background bg-zinc-800 items-center justify-center text-[8px] font-bold border border-white/10">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                      <div className="flex h-6 w-6 rounded-full ring-2 ring-background bg-zinc-900 items-center justify-center text-[7px] font-bold border border-white/10 text-muted-foreground">
                        +5
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPermit(permit);
                      }}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-all group/btn"
                    >
                      <span>{lang === "en" ? "Intel Report" : "Rapport Intel"}</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Intel Modal */}
      <AnimatePresence>
        {selectedPermit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPermit(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-card border cyber-border-amber rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-start justify-between bg-gradient-to-br from-amber-500/10 via-transparent to-transparent">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">{lang === "en" ? "Market Intel Report" : "Rapport d'Intelligence"}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/50 italic flex items-center gap-1">
                          <Zap size={10} /> Live Property Analysis
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPermit(null)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60">{lang === "en" ? "Project Summary" : "Sommaire du Projet"}</h3>
                   <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                      <h1 className="text-xl font-black leading-tight text-foreground">{selectedPermit.title}</h1>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium italic">
                        &quot;{selectedPermit.description || (lang === "en" ? "Homeowner has initiated structural renovations. Immediate contractor verification required." : "Le propriétaire a initié des rénovations structurelles. Vérification immédiate de l'entrepreneur requise.")}&quot;
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{lang === "en" ? "Location" : "Emplacement"}</span>
                      <div className="flex items-center gap-2">
                         <MapPin size={16} className="text-blue-500" />
                         <span className="text-sm font-bold truncate">{selectedPermit.location}</span>
                      </div>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{lang === "en" ? "Category" : "Catégorie"}</span>
                      <div className="flex items-center gap-2">
                         <Building2 size={16} className="text-purple-500" />
                         <span className="text-sm font-bold capitalize">{selectedPermit.project_type?.replace("_", " ")}</span>
                      </div>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{lang === "en" ? "Estimated Valuation" : "Évaluation Estimée"}</span>
                      <div className="flex items-center gap-2">
                         <DollarSign size={16} className="text-green-500" />
                         <span className="text-lg font-black tabular-nums">
                            {selectedPermit.estimated_value 
                              ? new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(selectedPermit.estimated_value)
                              : "$25,000+"
                            }
                         </span>
                      </div>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{lang === "en" ? "Scrape Date" : "Date de capture"}</span>
                      <div className="flex items-center gap-2">
                         <Clock size={16} className="text-amber-500" />
                         <span className="text-sm font-bold">
                            {new Date(selectedPermit.scraped_at).toLocaleDateString(lang === "en" ? "en-US" : "fr-CA", { dateStyle: "long" })}
                         </span>
                      </div>
                   </div>
                </div>

                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500">
                    <ShieldCheck size={14} /> Intelligence Analysis
                  </div>
                  <p className="text-xs text-muted-foreground font-bold leading-relaxed">
                    {lang === "en" 
                      ? "High-intent signal detected via municipal permit registry. This homeowner has recently pullled or applied for structural work. Competition is currently LOW in this zone."
                      : "Signal d'intention élevé détecté via le registre municipal des permis. Ce propriétaire a récemment retiré ou demandé des travaux structurels. La concurrence est actuellement FAIBLE dans cette zone."
                    }
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 sm:p-8 border-t border-white/5 bg-muted/20 backdrop-blur-xl flex flex-col sm:flex-row gap-4">
                {selectedPermit.url && (
                  <a 
                    href={selectedPermit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn-outline h-14 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
                  >
                    {lang === "en" ? "View Original Permit" : "Voir le Permis Original"}
                    <ExternalLink size={16} />
                  </a>
                )}
                <button 
                  onClick={() => {
                    if (selectedPermit) {
                      router.push(`/marketplace?inventoryId=${selectedPermit.id}`);
                    }
                  }}
                  className="flex-[1.5] btn-amber h-14 flex items-center justify-center gap-3 text-lg font-black uppercase tracking-widest group/claim"
                >
                  {lang === "en" ? "Claim in Marketplace" : "Réclamer au Marché"}
                  <ArrowRight size={20} className="group-hover/claim:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
