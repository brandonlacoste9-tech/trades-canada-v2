"use client";

import { useEffect, useState } from "react";
import { CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import type { Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  justPaid: boolean;
  currentTier: string | null;
}

export default function SubscriptionSyncBanner({ lang, justPaid, currentTier }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [tier, setTier] = useState(currentTier);

  // After Stripe redirects here, tier is often still null until we sync — always run once.
  useEffect(() => {
    if (justPaid) {
      void syncSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncSubscription = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/stripe/sync-subscription");
      const data = await res.json() as { tier?: string; synced?: boolean };
      if (data.tier) setTier(data.tier);
      if (data.synced) {
        setSynced(true);
        // Reload to reflect the new tier across the full page
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  };

  if (!justPaid && !synced) return null;

  const tierLabel = tier === "engine"
    ? (lang === "fr" ? "Moteur de Leads" : "Lead Engine")
    : tier === "dominator"
    ? (lang === "fr" ? "Dominateur du Marché" : "Market Dominator")
    : tier === "starter"
    ? (lang === "fr" ? "Lead Starter" : "Lead Starter")
    : tier ?? "—";

  return (
    <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] flex items-center gap-4">
      {syncing ? (
        <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
      ) : synced ? (
        <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
      ) : (
        <RefreshCw className="w-5 h-5 text-amber-400 shrink-0" />
      )}
      <div className="flex-1">
        <p className="font-display font-bold text-sm text-amber-400">
          {synced
            ? lang === "fr"
              ? `Plan activé : ${tierLabel}`
              : `Plan activated: ${tierLabel}`
            : syncing
            ? lang === "fr"
              ? "Vérification de votre abonnement…"
              : "Verifying your subscription…"
            : lang === "fr"
            ? "Paiement reçu! Synchronisation en cours…"
            : "Payment received! Syncing your plan…"}
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">
          {synced
            ? lang === "fr"
              ? "La page va se recharger automatiquement."
              : "The page will reload automatically."
            : lang === "fr"
            ? "Cela prendra quelques secondes."
            : "This will take just a moment."}
        </p>
      </div>
      {!syncing && !synced && (
        <button
          onClick={syncSubscription}
          className="btn-outline-amber text-xs px-3 py-1.5"
        >
          {lang === "fr" ? "Actualiser" : "Refresh"}
        </button>
      )}
    </div>
  );
}
