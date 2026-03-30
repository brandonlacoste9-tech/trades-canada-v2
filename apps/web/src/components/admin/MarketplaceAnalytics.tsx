"use client";

import { useEffect, useState } from "react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { 
  TrendingUp, Users, DollarSign, ArrowUpRight, 
  MapPin, RefreshCcw, FileText 
} from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsData {
  summary: {
    totalUnlocks: number;
    estimatedMonthlyRevenue: number;
    totalSubscribers: number;
  };
  recentUnlocks: Array<{
    id: string;
    unlocked_at: string;
    profiles: { display_name: string; company_name: string };
    leads: { project_type: string; city: string; status: string };
  }>;
  trends: Array<{ date: string; count: number }>;
  cityStats: Array<{ city: string; count: number }>;
}

const COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#10b981"];

export default function MarketplaceAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marketplace/stats");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCcw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-muted-foreground animate-pulse font-display font-medium uppercase tracking-widest text-xs">Aggregating Market Data...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card cyber-border p-6 rounded-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <DollarSign size={24} />
            </div>
            <span className="flex items-center gap-1 text-green-400 text-xs font-black">
              <ArrowUpRight size={14} /> +12%
            </span>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Estimated MRR</p>
            <h2 className="text-3xl font-black text-foreground">${data.summary.estimatedMonthlyRevenue.toLocaleString()}</h2>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card cyber-border p-6 rounded-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] text-blue-500/50 uppercase tracking-widest font-black">Market Velocity</span>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Total Lead Unlocks</p>
            <h2 className="text-3xl font-black text-foreground">{data.summary.totalUnlocks}</h2>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card cyber-border p-6 rounded-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Users size={24} />
            </div>
            <span className="text-[10px] text-purple-500/50 uppercase tracking-widest font-black">Active Marketplace</span>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Subscribed Partners</p>
            <h2 className="text-3xl font-black text-foreground">{data.summary.totalSubscribers}</h2>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="glass-card cyber-border p-8 rounded-2xl flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg uppercase tracking-tight font-display">Unlock Trends</h3>
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Last 30 Days</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#666", fontSize: 10 }}
                  tickFormatter={(str) => new Date(str).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                  cursor={{ stroke: "#f59e0b", strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="count" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* City Stats */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="glass-card cyber-border p-8 rounded-2xl flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg uppercase tracking-tight font-display">City Intensity</h3>
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Market Distribution</span>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.cityStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="city"
                >
                  {data.cityStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 ml-4 max-w-[140px]">
              {data.cityStats.slice(0, 5).map((city, idx) => (
                <div key={city.city} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[10px] font-black uppercase tracking-tight truncate">{city.city} ({city.count})</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activity Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card cyber-border rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-black text-lg uppercase tracking-tight font-display">Marketplace Stream</h3>
          <button 
            onClick={fetchData} 
            className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-white/[0.02]">
              <tr>
                <th className="px-6 py-4">Contractor / Company</th>
                <th className="px-6 py-4">Lead Unlocked</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.recentUnlocks.map((unlock) => (
                <tr key={unlock.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{unlock.profiles?.display_name || "Unknown"}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">{unlock.profiles?.company_name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" size={14} />
                      <span className="text-xs font-medium text-foreground line-clamp-1">{unlock.leads?.project_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500/80 uppercase tracking-tight">
                      <MapPin size={12} />
                      {unlock.leads?.city}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] text-muted-foreground font-mono">
                    {new Date(unlock.unlocked_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
