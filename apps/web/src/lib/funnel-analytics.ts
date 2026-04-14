/**
 * Lightweight marketing funnel events for GTM / GA4 (dataLayer) and debugging.
 * Meta Pixel events stay in useMetaEvents.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export type FunnelPayload = {
  event: string;
  tier?: string;
  price_id?: string;
  value_cad?: number;
  lang?: string;
};

export function pushFunnelEvent(payload: FunnelPayload): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    ...payload,
    event: payload.event,
  });
}
