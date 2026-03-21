"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface LeadFormProps {
  lang: Lang;
}

const projectTypes = {
  en: ["Renovation", "New Construction", "Plumbing", "Electrical", "Roofing", "HVAC", "Landscaping", "Other"],
  fr: ["Rénovation", "Nouvelle construction", "Plomberie", "Électricité", "Toiture", "CVAC", "Aménagement paysager", "Autre"],
};

const projectTypeValues = ["renovations", "general", "plumbing", "electrical", "roofing", "hvac", "landscaping", "other"];

export default function LeadForm({ lang }: LeadFormProps) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", projectType: "renovations" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { error: dbError } = await supabase.from("leads").insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        project_type: form.projectType as any,
        language: lang,
        source: "web",
        status: "new",
      });

      if (dbError) throw dbError;
      setSuccess(true);
    } catch {
      setError(lang === "en" ? "Something went wrong. Please try again." : "Une erreur est survenue. Veuillez réessayer.");
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
