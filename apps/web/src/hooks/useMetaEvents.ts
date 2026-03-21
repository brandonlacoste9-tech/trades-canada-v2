"use client";

import { trackEvent, type FbqEvent } from "@/components/shared/MetaPixel";


// ─── useMetaEvents ────────────────────────────────────────────────────────────
// Fires both the client-side Meta Pixel AND the server-side CAPI simultaneously.
// The shared event_id deduplicates the event in Meta's system so it's counted once.

interface MetaEventOptions {
  email?: string;
  phone?: string;
  city?: string;
  value?: number;
  currency?: string;
}

export function useMetaEvents() {
  async function fire(event: FbqEvent, opts: MetaEventOptions = {}) {
    const event_id = crypto.randomUUID();

    // 1. Client-side pixel (for browser attribution)
    trackEvent(event, {
      event_id,
      ...(opts.value ? { value: opts.value, currency: opts.currency ?? "CAD" } : {}),
      ...(opts.city ? { content_name: opts.city } : {}),
    });

    // 2. Server-side CAPI (bypasses blockers, iOS 14+)
    try {
      await fetch("/api/meta-capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: event,
          event_id,
          ...opts,
        }),
      });
    } catch {
      // CAPI failure is non-blocking — pixel already fired
    }
  }

  return {
    // ── Homeowner events ────────────────────────────────────────────────────
    trackLeadFormView: (city: string) => fire("ViewContent", { city }),
    trackLeadSubmitted: (email: string, phone: string, city: string) =>
      fire("Lead", { email, phone, city }),

    // ── Contractor events ───────────────────────────────────────────────────
    trackSignupStarted: () => fire("CompleteRegistration"),
    trackCheckoutStarted: (value: number) => fire("InitiateCheckout", { value }),
    trackSubscribed: (email: string, value: number) =>
      fire("Subscribe", { email, value }),
    trackPurchase: (email: string, value: number) =>
      fire("Purchase", { email, value }),

    // ── Generic ─────────────────────────────────────────────────────────────
    trackContact: () => fire("Contact"),
  };
}
