"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";

interface ROICalculatorProps {
  lang: Lang;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function ROICalculator({ lang }: ROICalculatorProps) {
  const [leads, setLeads] = useState(20);
  const [avgJob, setAvgJob] = useState(5000);
  const [closeRate, setCloseRate] = useState(25);

  const { monthly, annual, roi } = useMemo(() => {
    const monthly = leads * (closeRate / 100) * avgJob;
    const annual = monthly * 12;
    const platformCost = 349 * 12; // Lead Engine tier
    const roi = ((annual - platformCost) / platformCost) * 100;
    return { monthly, annual, roi };
  }, [leads, avgJob, closeRate]);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="section-label mx-auto w-fit">{t("roi.badge", lang)}</div>
          <h2 className="heading-lg mt-4 mb-4">{t("roi.heading", lang)}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("roi.sub", lang)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto"
        >
          {/* Sliders */}
          <div className="glass-card cyber-border rounded-2xl p-8 space-y-8">
            {/* Leads */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-display text-sm font-semibold text-foreground">
                  {t("roi.leadsPerMonth", lang)}
                </label>
                <span className="font-display font-bold text-amber-400 text-lg">{leads}</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={leads}
                onChange={(e) => setLeads(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500
                           [&::-webkit-slider-thumb]:shadow-amber-sm [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                           accent-amber-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5</span><span>100</span>
              </div>
            </div>

            {/* Avg Job */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-display text-sm font-semibold text-foreground">
                  {t("roi.avgJobPrice", lang)}
                </label>
                <span className="font-display font-bold text-amber-400 text-lg">
                  ${avgJob.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={50000}
                step={500}
                value={avgJob}
                onChange={(e) => setAvgJob(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500
                           [&::-webkit-slider-thumb]:shadow-amber-sm [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$1K</span><span>$50K</span>
              </div>
            </div>

            {/* Close Rate */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-display text-sm font-semibold text-foreground">
                  {t("roi.closeRate", lang)}
                </label>
                <span className="font-display font-bold text-amber-400 text-lg">{closeRate}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={80}
                step={5}
                value={closeRate}
                onChange={(e) => setCloseRate(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500
                           [&::-webkit-slider-thumb]:shadow-amber-sm [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5%</span><span>80%</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col gap-4">
            <div className="glass-card cyber-border rounded-2xl p-6 flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-display tracking-wider uppercase mb-1">
                  {t("roi.monthlyRevenue", lang)}
                </p>
                <motion.p
                  key={monthly}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display font-bold text-3xl text-gradient-amber"
                >
                  {formatCurrency(monthly)}
                </motion.p>
              </div>
            </div>

            <div className="glass-card cyber-border rounded-2xl p-6 flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-display tracking-wider uppercase mb-1">
                  {t("roi.annualRevenue", lang)}
                </p>
                <motion.p
                  key={annual}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display font-bold text-3xl text-gradient-amber"
                >
                  {formatCurrency(annual)}
                </motion.p>
              </div>
            </div>

            <div className="glass-card cyber-border rounded-2xl p-6 flex items-center gap-4 flex-1 bg-amber-500/5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-display tracking-wider uppercase mb-1">
                  {t("roi.roiLabel", lang)}
                </p>
                <motion.p
                  key={roi}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display font-bold text-3xl text-amber-300"
                >
                  +{Math.max(0, Math.round(roi)).toLocaleString()}%
                </motion.p>
              </div>
            </div>

            <Link href={`/${lang}/booking`} className="btn-amber text-sm justify-center">
              {t("hero.cta1", lang)}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
