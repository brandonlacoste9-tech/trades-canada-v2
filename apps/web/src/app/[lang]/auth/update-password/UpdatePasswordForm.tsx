"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface Props {
  lang: Lang;
}

export default function UpdatePasswordForm({ lang }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          // User arrived from recovery link — form is ready
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError(
        lang === "en"
          ? "Password must be at least 6 characters."
          : "Le mot de passe doit comporter au moins 6 caractères."
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(
        lang === "en"
          ? "Passwords do not match."
          : "Les mots de passe ne correspondent pas."
      );
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      router.push(`/${lang}/dashboard`);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card cyber-border rounded-2xl p-8 w-full max-w-md"
      >
        {success ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              {lang === "en" ? "Password Updated" : "Mot de passe mis à jour"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {lang === "en"
                ? "Redirecting to your dashboard..."
                : "Redirection vers votre tableau de bord..."}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h1 className="font-display font-bold text-2xl text-foreground">
                {lang === "en" ? "Set New Password" : "Définir un nouveau mot de passe"}
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                {lang === "en"
                  ? "Enter your new password below."
                  : "Entrez votre nouveau mot de passe ci-dessous."}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg text-sm font-display bg-destructive/10 border border-destructive/30 text-destructive"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={lang === "en" ? "New password" : "Nouveau mot de passe"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-amber pl-10 pr-10"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={lang === "en" ? "Confirm password" : "Confirmer le mot de passe"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-amber pl-10"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-amber w-full justify-center mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    {lang === "en" ? "Update Password" : "Mettre à jour"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
