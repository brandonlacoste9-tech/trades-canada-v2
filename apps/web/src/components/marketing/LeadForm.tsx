"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { type Lang } from "@/lib/i18n";
import { useMetaEvents } from "@/hooks/useMetaEvents";

interface LeadFormProps {
  lang: Lang;
  city?: string; // passed from city landing pages for geo-targeted CAPI
}

// Values must match the `trade_category` enum in the Supabase DB
const projectTypes = {
  en: ["General Contractor", "Plumbing", "Electrical", "Roofing", "HVAC", "Landscaping", "Flooring", "Painting", "Other"],
  fr: ["Entrepreneur général", "Plomberie", "Électricité", "Toiture", "CVAC", "Aménagement paysager", "Planchers", "Peinture", "Autre"],
};

const projectTypeValues = ["general_contractor", "plumbing", "electrical", "roofing", "hvac", "landscaping", "flooring", "painting", "other"];

type LeadSubmitErrorMeta = { status?: number; apiCode?: string };

export default function LeadForm({ lang, city }: LeadFormProps) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", projectType: "general_contractor" });
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const formRenderedAt = useRef(Date.now());
  const meta = useMetaEvents();

  // Fire ViewContent when the form mounts (homeowner audience signal)
  useEffect(() => {
    if (city) meta.trackLeadFormView(city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ── Insert via server-side API route to bypass Supabase anon RLS ──────
      // The anon Supabase client cannot INSERT into `leads` unless an explicit
      // RLS policy grants it. Routing through /api/leads uses the service role
      // key server-side, which always bypasses RLS safely.
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          project_type: form.projectType,
          language: lang,
          city: city ?? null,
          website,
          form_rendered_at: formRenderedAt.current,
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        let payload: { error?: string; code?: string; details?: unknown } = {};
        try {
          payload = raw ? (JSON.parse(raw) as { error?: string; code?: string; details?: unknown }) : {};
        } catch {
          console.error("[LeadForm] non-JSON error body", res.status, raw.slice(0, 200));
        }
        const msg = payload?.error ?? `HTTP ${res.status}`;
        const apiCode = payload?.code;
        console.error("[LeadForm] insert error:", res.status, msg);
        const err = new Error(msg) as Error & { status?: number; apiCode?: string };
        err.status = res.status;
        err.apiCode = apiCode;
        throw err;
      }

      // Lead is saved — show success first; analytics must never block UX.
      setSuccess(true);

      try {
        await meta.trackLeadSubmitted(form.email, form.phone, city ?? "canada");
      } catch (trackErr) {
        console.warn("[LeadForm] Meta tracking failed (non-blocking):", trackErr);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const ext: LeadSubmitErrorMeta =
        err instanceof Error ? (err as Error & LeadSubmitErrorMeta) : {};
      const status = ext.status;
      const apiCode = ext.apiCode;
      console.error("[LeadForm] submission failed:", msg, status ?? "", apiCode ?? "");
      const isConfig =
        apiCode === "MISSING_SERVICE_ROLE" ||
        apiCode === "ANON_KEY_AS_SERVICE_ROLE" ||
        /credentials not configured|service role|SUPABASE/i.test(msg) ||
        msg.includes("Invalid API key") ||
        msg.includes("JWT");
      const isNotFound = status === 404 || /HTTP 404/i.test(msg);
      const isRateLimited = status === 429 || /too many requests/i.test(msg);
      const isNetwork = /failed to fetch|networkerror|load failed|aborted|unexpected token/i.test(msg);

      if (isRateLimited) {
        setError(
          lang === "en"
            ? "Too many submissions from this network. Please wait a few minutes and try again."
            : "Trop de demandes depuis ce réseau. Attendez quelques minutes et réessayez."
        );
      } else if (status === 422) {
        setError(
          lang === "en"
            ? "Please check your name, email, and selections, then try again."
            : "Vérifiez le nom, le courriel et les choix, puis réessayez."
        );
      } else if (isNotFound || isNetwork) {
        setError(
          lang === "en"
            ? "We could not reach the form service. Check that the site is deployed correctly, or email us directly."
            : "Impossible d’atteindre le service du formulaire. Vérifiez le déploiement ou écrivez-nous directement."
        );
      } else if (isConfig) {
        setError(
          lang === "en"
            ? "Our form is temporarily unavailable. Please email us or try again later."
            : "Notre formulaire est temporairement indisponible. Écrivez-nous ou réessayez plus tard."
        );
      } else if (apiCode === "DB_INSERT_FAILED") {
        setError(
          lang === "en"
            ? "We couldn't save your request. Please try again in a few minutes or email us directly."
            : "Impossible d’enregistrer votre demande. Réessayez dans quelques minutes ou écrivez-nous."
        );
      } else {
        setError(lang === "en" ? "Something went wrong. Please try again." : "Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card cyber-border rounded-2xl p-10 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="font-display font-bold text-xl mb-2">
          {lang === "en" ? "Request Received!" : "Demande reçue!"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {lang === "en"
            ? "We'll reach out within 24 hours to discuss your growth strategy."
            : "Nous vous contacterons dans les 24 heures pour discuter de votre stratégie de croissance."}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="glass-card cyber-border rounded-2xl p-8">
      <h3 className="font-display font-bold text-xl mb-2">
        {lang === "en" ? "Get Your Free Estimate" : "Obtenez votre estimation gratuite"}
      </h3>
      <p className="text-muted-foreground text-sm mb-6">
        {lang === "en"
          ? "Tell us about your business and we'll build your custom growth plan."
          : "Parlez-nous de votre entreprise et nous créerons votre plan de croissance personnalisé."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <input
          type="text"
          required
          placeholder={lang === "en" ? "Full Name" : "Nom complet"}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-amber"
        />
        <input
          type="tel"
          placeholder={lang === "en" ? "Phone Number" : "Numéro de téléphone"}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="input-amber"
        />
        <input
          type="email"
          required
          placeholder={lang === "en" ? "Email Address" : "Adresse courriel"}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="input-amber"
        />
        <select
          value={form.projectType}
          onChange={(e) => setForm({ ...form, projectType: e.target.value })}
          className="input-amber"
        >
          {projectTypes[lang].map((label, i) => (
            <option key={projectTypeValues[i]} value={projectTypeValues[i]} className="bg-background">
              {label}
            </option>
          ))}
        </select>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-amber w-full justify-center">
          {loading ? (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              {lang === "en" ? "Submit & Book a Call" : "Soumettre et réserver un appel"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
