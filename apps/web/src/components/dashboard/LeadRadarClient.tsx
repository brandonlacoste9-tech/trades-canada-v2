"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, FileText, DollarSign, ExternalLink, Search, Filter } from "lucide-react";
import { type Lang } from "@/lib/i18n";
import { cities } from "@/lib/cityData";
import type { Database } from "@/types/database";

type Permit = Database["public"]["Tables"]["scraped_inventory"]["Row"];

interface LeadRadarClientProps {
  permits: Permit[];
  lang: Lang;
}

export default function LeadRadarClient({ permits, lang }: LeadRadarClientProps) {
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

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
      {/* Filters */}
      <div className="glass-card cyber-border rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={lang === "en" ? "Search permits..." : "Rechercher des permis..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-amber pl-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="input-amber text-sm"
          >
            <option value="all">{lang === "en" ? "All Cities" : "Toutes les villes"}</option>
            {cityOptions.map((c) => (
              <option key={c.slug} value={c.slug} className="bg-background">
                {lang === "fr" ? c.nameFr : c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-amber text-sm"
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

      {/* Count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-display">
          {filtered.length} {lang === "en" ? "permits found" : "permis trouvés"}
        </p>
        <span className="badge-amber text-xs">
          {lang === "en" ? "Live Data" : "Données en direct"}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12 text-muted-foreground text-sm"
            >
              {lang === "en" ? "No permits match your filters." : "Aucun permis ne correspond à vos filtres."}
            </motion.div>
          ) : (
            filtered.map((permit) => (
              <motion.div
                key={permit.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="glass-card-hover cyber-border rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display font-semibold text-sm text-foreground line-clamp-2 flex-1">
                    {permit.title}
                  </h4>
                  {permit.url && (
                    <a
                      href={permit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-amber-400 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {permit.description && (
                  <p className="text-muted-foreground text-xs line-clamp-2">{permit.description}</p>
                )}

                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                  {permit.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500/60" />
                      {permit.location}
                    </span>
                  )}
                  {permit.permit_number && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {permit.permit_number}
                    </span>
                  )}
                  {permit.estimated_value && (
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <DollarSign className="w-3 h-3" />
                      ${permit.estimated_value.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {permit.project_type && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-display bg-amber-500/10 border border-amber-500/20 text-amber-400 capitalize">
                      {permit.project_type.replace("_", " ")}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(permit.scraped_at).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA")}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
