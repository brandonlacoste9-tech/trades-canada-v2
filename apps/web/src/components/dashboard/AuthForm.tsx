"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, Mail, Lock, User, Building2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  lang: Lang;
  planId?: string;
  initialMode?: "login" | "signup" | "reset";
}

type Mode = "login" | "signup" | "reset";

export default function AuthForm({ lang, planId, initialMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    companyName: "",
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        router.push(`/${lang}/dashboard`);
        router.refresh();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              display_name: form.displayName,
              company_name: form.companyName,
            },
            emailRedirectTo: `${window.location.origin}/${lang}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage({ type: "success", text: t("auth.verifyEmail", lang) });
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/${lang}/auth/update-password`,
        });
        if (error) throw error;
        setMessage({
          type: "success",
          text: lang === "en"
            ? "Reset link sent! Check your email."
            : "Lien envoyé! Vérifiez votre courriel.",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? t("auth.invalidCreds", lang) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card cyber-border rounded-2xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          {mode === "login" ? (
            <LogIn className="w-6 h-6 text-amber-400" />
          ) : mode === "signup" ? (
            <UserPlus className="w-6 h-6 text-amber-400" />
          ) : (
            <Mail className="w-6 h-6 text-amber-400" />
          )}
        </div>
        <h1 className="font-display font-bold text-2xl text-foreground">
          {mode === "login"
            ? t("auth.login", lang)
            : mode === "signup"
            ? t("auth.signup", lang)
            : t("auth.resetPassword", lang)}
        </h1>
        {planId && mode === "signup" && (
          <p className="text-amber-400 text-xs font-display mt-1">
            {lang === "en" ? "Creating account for selected plan" : "Création de compte pour le plan sélectionné"}
          </p>
        )}
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-4 p-3 rounded-lg text-sm font-display ${
              message.type === "error"
                ? "bg-destructive/10 border border-destructive/30 text-destructive"
                : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Signup-only fields */}
        <AnimatePresence>
          {mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder={t("auth.displayName", lang)}
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="input-amber pl-10"
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("auth.companyName", lang)}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="input-amber pl-10"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            required
            placeholder={t("auth.email", lang)}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-amber pl-10"
          />
        </div>

        {/* Password */}
        {mode !== "reset" && (
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder={t("auth.password", lang)}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-amber pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Forgot password */}
        {mode === "login" && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="text-muted-foreground text-xs hover:text-amber-400 transition-colors font-display"
            >
              {t("auth.forgotPassword", lang)}
            </button>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-amber w-full justify-center mt-2">
          {loading ? (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              {mode === "login"
                ? t("auth.login", lang)
                : mode === "signup"
                ? t("auth.signup", lang)
                : t("auth.sendReset", lang)}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Mode switcher */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            {t("auth.noAccount", lang)}{" "}
            <button onClick={() => setMode("signup")} className="text-amber-400 hover:text-amber-300 font-display font-semibold transition-colors">
              {t("auth.signup", lang)}
            </button>
          </>
        ) : mode === "signup" ? (
          <>
            {t("auth.hasAccount", lang)}{" "}
            <button onClick={() => setMode("login")} className="text-amber-400 hover:text-amber-300 font-display font-semibold transition-colors">
              {t("auth.login", lang)}
            </button>
          </>
        ) : (
          <button onClick={() => setMode("login")} className="text-amber-400 hover:text-amber-300 font-display font-semibold transition-colors">
            {t("auth.backToLogin", lang)}
          </button>
        )}
      </div>
    </div>
  );
}
