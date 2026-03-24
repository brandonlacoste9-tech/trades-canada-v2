import type { Database, ProjectType } from "@/types/database";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "subscription_tier" | "city" | "services"
>;

export type ContractorTier = "starter" | "pro" | "elite";

export type LeadEligibility = {
  eligible: boolean;
  reason:
    | "ok"
    | "lead_already_claimed"
    | "service_mismatch"
    | "city_mismatch"
    | "wait_window_not_reached";
  waitMinutesRemaining: number;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeTier(rawTier: string | null | undefined): ContractorTier {
  const normalized = normalize(rawTier ?? "");
  if (normalized === "elite" || normalized.includes("dominator")) return "elite";
  if (normalized === "pro" || normalized.includes("lead engine")) return "pro";
  return "starter";
}

function projectTypeAliases(projectType: ProjectType): string[] {
  const map: Record<ProjectType, string[]> = {
    hvac: ["hvac", "cvac"],
    roofing: ["roofing", "toiture"],
    landscaping: ["landscaping", "amenagement", "aménagement paysager"],
    renovations: ["renovation", "renovations", "renovation generale"],
    plumbing: ["plumbing", "plomberie"],
    electrical: ["electrical", "electricite", "électricité"],
    general: ["general", "general contracting", "entrepreneur general"],
    other: ["other"],
  };
  return map[projectType];
}

function serviceMatches(lead: Lead, services: string[] | null): boolean {
  if (!services || services.length === 0) return true;
  const normalizedServices = services.map(normalize);
  const aliases = projectTypeAliases(lead.project_type);
  return aliases.some((alias) =>
    normalizedServices.some((service) => service.includes(alias) || alias.includes(service))
  );
}

function cityMatches(lead: Lead, profileCity: string | null): boolean {
  if (!profileCity || !lead.city) return true;
  return normalize(profileCity) === normalize(lead.city);
}

function requiredWaitMinutes(score: number, tier: ContractorTier): number {
  if (score >= 80) {
    if (tier === "elite") return 0;
    if (tier === "pro") return 20;
    return 120;
  }
  if (score >= 60) {
    if (tier === "starter") return 30;
    return 0;
  }
  return 0;
}

export function evaluateLeadEligibility(lead: Lead, profile: Profile, now = new Date()): LeadEligibility {
  if (lead.contractor_id) {
    return { eligible: false, reason: "lead_already_claimed", waitMinutesRemaining: 0 };
  }

  if (!serviceMatches(lead, profile.services)) {
    return { eligible: false, reason: "service_mismatch", waitMinutesRemaining: 0 };
  }

  if (!cityMatches(lead, profile.city)) {
    return { eligible: false, reason: "city_mismatch", waitMinutesRemaining: 0 };
  }

  const score = lead.score ?? 50;
  const tier = normalizeTier(profile.subscription_tier);
  const waitMinutes = requiredWaitMinutes(score, tier);
  const leadAgeMinutes = Math.floor((now.getTime() - new Date(lead.created_at).getTime()) / (60 * 1000));

  if (leadAgeMinutes < waitMinutes) {
    return {
      eligible: false,
      reason: "wait_window_not_reached",
      waitMinutesRemaining: waitMinutes - leadAgeMinutes,
    };
  }

  return { eligible: true, reason: "ok", waitMinutesRemaining: 0 };
}
