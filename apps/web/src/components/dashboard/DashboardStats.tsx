"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, CheckCircle, DollarSign } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

interface DashboardStatsProps {
  stats: {
    total: number;
    newThisWeek: number;
    converted: number;
    revenue: number;
  };
  lang: Lang;
}

export default function DashboardStats({ stats, lang }: DashboardStatsProps) {
  const items = [
    { icon: Users, label: t("dashboard.totalLeads", lang), value: stats.total.toString(), color: "text-amber-400" },
    { icon: TrendingUp, label: t("dashboard.newLeads", lang), value: stats.newThisWeek.toString(), color: "text-amber-300" },
    { icon: CheckCircle, label: t("dashboard.converted", lang), value: stats.converted.toString(), color: "text-amber-400" },
    {
      icon: DollarSign,
      label: t("dashboard.revenue", lang),
      value: `$${(stats.revenue / 1000).toFixed(0)}K`,
      color: "text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ icon: Icon, label, value, color }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-muted-foreground text-xs font-display tracking-wide">{label}</p>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
          </div>
          <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
        </motion.div>
      ))}
    </div>
  );
}
