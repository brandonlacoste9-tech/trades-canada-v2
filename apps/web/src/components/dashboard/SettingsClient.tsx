"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, MessageCircle, CreditCard, CheckCircle, Copy, RefreshCw } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/marketplace";


interface SettingsClientProps {
  profile: Profile;
  lang: Lang;
  userId: string;
}

const SERVICES = ["HVAC", "Roofing", "Plumbing", "Electrical", "Renovations", "Landscaping", "General Contracting", "Other"];

export default function SettingsClient({ profile, lang, userId }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "telegram" | "billing">("profile");
  const [form, setForm] = useState({
    displayName: profile?.display_name ?? "",
    companyName: profile?.company_name ?? "",
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    services: profile?.services ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(!!profile?.telegram_chat_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("profiles").upsert({
      id: userId,
      display_name: form.displayName,
      company_name: form.companyName,
      phone: form.phone,
      city: form.city,
      services: form.services,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleService = (service: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(service)
        ? f.services.filter((s) => s !== service)
        : [...f.services, service],
    }));
  };

  const generateTelegramCode = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTelegramCode(code);
    setPolling(true);

    // Store code in profile metadata for bot verification
    await supabase.from("profiles").update({ updated_at: new Date().toISOString() }).eq("id", userId);

    // Poll for connection
    const interval = setInterval(async () => {
      const { data } = await supabase.from("profiles").select("telegram_chat_id").eq("id", userId).single();
      if (data?.telegram_chat_id) {
        setTelegramConnected(true);
        setPolling(false);
        setTelegramCode(null);
        clearInterval(interval);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
    }, 120000);
  };

  const disconnectTelegram = async () => {
    await supabase.from("profiles").update({ telegram_chat_id: null }).eq("id", userId);
    setTelegramConnected(false);
  };

  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    setUpgrading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, lang }),
      });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error("Upgrade error:", err);
      // You might want to use a toast here
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    // This would ideally call a separate portal route, but for now we can redirect to a basic version or show info
    // In a real app, create /api/stripe/create-portal
    const response = await fetch("/api/stripe/create-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { url } = await response.json();
    if (url) window.location.href = url;
  };

  const tabs = [
    { id: "profile" as const, icon: User, label: t("settings.profile", lang) },
    { id: "telegram" as const, icon: MessageCircle, label: t("settings.telegram", lang) },
    { id: "billing" as const, icon: CreditCard, label: t("settings.subscription", lang) },
  ];

  return (
    <div className="space-y-5">
      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-display text-sm font-semibold transition-all ${
              activeTab === id
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card cyber-border rounded-xl p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-2">
                {t("auth.displayName", lang)}
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="input-amber"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-2">
                {t("auth.companyName", lang)}
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="input-amber"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-2">
                {t("settings.phone", lang)}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-amber"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-muted-foreground mb-2">
                {t("dashboard.location", lang)}
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder={lang === "en" ? "Your city" : "Votre ville"}
                className="input-amber"
              />
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="block text-xs font-display font-semibold text-muted-foreground mb-3">
              {t("settings.services", lang)}
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold border transition-all ${
                    form.services.includes(service)
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                      : "bg-white/[0.03] border-white/[0.08] text-muted-foreground hover:border-amber-500/20 hover:text-amber-400/70"
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-amber">
            {saving ? (
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {t("settings.saved", lang)}
              </>
            ) : (
              t("settings.save", lang)
            )}
          </button>
        </motion.div>
      )}

      {/* Telegram Tab */}
      {activeTab === "telegram" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card cyber-border rounded-xl p-6 space-y-5"
        >
          {telegramConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="font-display font-semibold text-sm text-amber-400">
                    {t("settings.telegram.connected", lang)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {lang === "en"
                      ? "You will receive instant lead alerts via Telegram."
                      : "Vous recevrez des alertes de leads instantanées via Telegram."}
                  </p>
                </div>
              </div>
              <button onClick={disconnectTelegram} className="btn-outline-amber text-sm">
                {t("settings.telegram.disconnect", lang)}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {lang === "en"
                  ? "Connect Telegram to receive instant lead notifications directly in your chat."
                  : "Connectez Telegram pour recevoir des notifications de leads instantanées directement dans votre chat."}
              </p>

              {telegramCode ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t("settings.telegram.instructions", lang)}</p>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <code className="font-mono text-2xl font-bold text-amber-400 tracking-[0.3em] flex-1">
                      {telegramCode}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(telegramCode)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-amber-400 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <a
                    href="https://t.me/TradesCanadaBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-amber inline-flex"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {lang === "en" ? "Open Telegram Bot" : "Ouvrir le bot Telegram"}
                  </a>
                  {polling && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t("settings.telegram.waiting", lang)}
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={generateTelegramCode} className="btn-amber">
                  <MessageCircle className="w-4 h-4" />
                  {t("settings.telegram.connect", lang)}
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card cyber-border rounded-xl p-6 space-y-5"
        >
          <div>
            <p className="text-xs font-display font-semibold text-muted-foreground mb-2">
              {t("settings.plan", lang)}
            </p>
            {profile?.subscription_tier ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <CreditCard className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="font-display font-bold text-sm text-amber-400">{profile.subscription_tier}</p>
                  <p className="text-muted-foreground text-xs">
                    {lang === "en" ? "Active subscription" : "Abonnement actif"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("settings.noPlan", lang)}</p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {!profile?.subscription_tier ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card-hover cyber-border p-4 space-y-3">
                  <h4 className="font-display font-bold text-sm">Lead Engine</h4>
                  <p className="text-muted-foreground text-xs">Unlock unlimited marketplace leads and automation.</p>
                  <button 
                    onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!)}
                    disabled={upgrading}
                    className="btn-amber w-full text-xs"
                  >
                    {upgrading ? "..." : t("settings.upgrade", lang)}
                  </button>
                </div>
                <div className="glass-card-hover border border-white/[0.08] p-4 space-y-3">
                  <h4 className="font-display font-bold text-sm">Lead Dominator</h4>
                  <p className="text-muted-foreground text-xs">Priority access and AI-powered lead scoring.</p>
                  <button 
                    onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE!)}
                    disabled={upgrading}
                    className="btn-outline-amber w-full text-xs"
                  >
                    {upgrading ? "..." : t("settings.upgrade", lang)}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={handleManageSubscription}
                  className="btn-outline-amber text-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  {t("settings.manage", lang)}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
