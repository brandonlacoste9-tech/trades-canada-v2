"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  isConnected: boolean;
}

export default function TelegramOnboardingBanner({ lang, isConnected }: Props) {
  const [dismissed, setDismissed] = React.useState(false);

  if (isConnected || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/50 to-orange-600/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        
        <div className="relative glass-card bg-amber-500/[0.03] border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 overflow-hidden">
          {/* Background Highlight */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center relative">
            <MessageCircle className="w-7 h-7 text-amber-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background animate-pulse" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-display font-bold text-foreground mb-1 flex items-center justify-center md:justify-start gap-2">
              {lang === "en" ? "Get Instant Lead Alerts" : "Recevez des alertes instantanées"}
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] uppercase tracking-widest font-black border border-amber-500/30">
                New Feature
              </span>
            </h3>
            <p className="text-muted-foreground text-sm max-w-xl">
              {lang === "en" 
                ? "Connect your Telegram bot to receive new construction leads the second they arrive. Never miss an opportunity again." 
                : "Connectez votre bot Telegram pour recevoir les nouveaux leads de construction dès leur arrivée. Ne manquez plus jamais une opportunité."}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link 
              href="/dashboard/settings?tab=telegram"
              className="btn-amber px-6 py-3 text-sm font-bold flex-1 md:flex-none justify-center"
            >
              {lang === "en" ? "Setup Telegram" : "Configurer Telegram"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <button 
              onClick={() => setDismissed(true)}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-muted-foreground hover:text-foreground transition-all"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
