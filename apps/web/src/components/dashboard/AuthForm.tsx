"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, Mail, Lock, User, Building2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useMetaEvents } from "@/hooks/useMetaEvents";

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
  const meta = useMetaEvents();
  /** Avoid duplicate Stripe session if React Strict Mode runs the effect twice. */
  const checkoutGuardKey =
    typeof planId === "string" ? `tc_stripe_launch_${planId}` : null;

  const startStripeCheckout = useCallback(
    async (activePriceId: string): Promise<{ ok: true } | { ok: false; message: string }> => {
      setLoading(true);
      try {
        const res = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId: activePriceId, lang }),
        });
        const payload = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) {
          return {
            ok: false,
            message: payload.error ?? (lang === "en" ? "Could not start checkout." : "Impossible de démarrer le paiement."),
          };
        }
        if (!payload.url) {
          return {
            ok: false,
            message: lang === "en" ? "Missing checkout URL." : "URL de paiement manquante.",
          };
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("pending_price_id");
        }
        window.location.href = payload.url;
        return { ok: true };
      } catch (err) {
        console.error("Checkout failed:", err);
        return {
          ok: false,
          message: lang === "en" ? "Could not start checkout. Try again or use Settings → Billing." : "Paiement impossible. Réessayez ou utilisez Paramètres → Facturation.",
        };
      } finally {
        setLoading(false);
      }
    },
    [lang]
  );

  const maybeStartCheckout = async () => {
    let activePriceId = planId;
    if (!activePriceId && typeof window !== "undefined") {
      activePriceId = localStorage.getItem("pending_price_id") || undefined;
    }

    if (!activePriceId) return false;

    const result = await startStripeCheckout(activePriceId);
    if (!result.ok && "message" in result) {
      setMessage({ type: "error", text: result.message });
    }
    return result.ok;
  };

  // Logged-in users used to be redirected away from /auth?plan=... by middleware; now allowed.
  // If they land here with a session + plan, send them straight to Stripe.
  useEffect(() => {
    if (!planId || !checkoutGuardKey) return;

    let cancelled = false;

    (async () => {
      if (typeof window !== "undefined" && sessionStorage.getItem(checkoutGuardKey)) return;

      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (cancelled || !user) return;

      if (typeof window !== "undefined") {
        sessionStorage.setItem(checkoutGuardKey, "1");
      }

      const result = await startStripeCheckout(planId);
      if (!result.ok && "message" in result) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(checkoutGuardKey);
        }
        setMessage({ type: "error", text: result.message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [planId, checkoutGuardKey, startStripeCheckout]);

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
        const redirectedToCheckout = await maybeStartCheckout();
        if (!redirectedToCheckout) {
          const hadPlanIntent =
            Boolean(planId) ||
            (typeof window !== "undefined" && Boolean(localStorage.getItem("pending_price_id")));
          // If checkout failed after login, keep user on auth so they see the error — don't send them to "free" dashboard.
          if (!hadPlanIntent) {
            router.push(`/${lang}/dashboard`);
            router.refresh();
          }
        }
      } else if (mode === "signup") {
        const checkoutNext = planId
          ? `/${lang}/auth?mode=login&plan=${encodeURIComponent(planId)}`
          : `/${lang}/dashboard`;

        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              display_name: form.displayName,
              company_name: form.companyName,
            },
            emailRedirectTo: `${window.location.origin}/${lang}/auth/callback?next=${encodeURIComponent(checkoutNext)}`,
          },
        });
        if (error) throw error;
        // Fire contractor acquisition event
        await meta.trackSignupStarted();
        
        // Record intent for post-verification logic
        if (planId && typeof window !== "undefined") {
          localStorage.setItem("pending_price_id", planId);
        }

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("auth.invalidCreds", lang);
      setMessage({ type: "error", text: errorMessage });
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
        {planId && (mode === "signup" || mode === "login") && (
          <p className="text-amber-400 text-xs font-display mt-1">
            {lang === "en"
              ? "Selected plan will continue to secure checkout"
              : "Le plan sélectionné continuera vers le paiement sécurisé"}
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
