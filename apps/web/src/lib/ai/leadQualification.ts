import type { ProjectType, PreferredLanguage } from "@/types/database";

type LeadInput = {
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  projectType: ProjectType;
  language: PreferredLanguage;
};

export type LeadQualification = {
  score: number;
  summary: string;
  nextAction: "email_now" | "send_booking_link" | "nurture";
  provider: "openai" | "heuristic";
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function heuristicQualification(input: LeadInput): LeadQualification {
  let score = 45;

  if (input.phone) score += 15;
  if (input.city) score += 10;
  if (input.projectType !== "other") score += 10;
  if (input.projectType === "roofing" || input.projectType === "hvac" || input.projectType === "electrical") {
    score += 5;
  }

  const normalizedScore = clamp(score, 10, 95);
  const nextAction =
    normalizedScore >= 75 ? "email_now" : normalizedScore >= 60 ? "send_booking_link" : "nurture";

  const summary =
    input.language === "fr"
      ? `Lead auto-qualifié (${normalizedScore}/100). Projet: ${input.projectType}. ${
          input.phone ? "Téléphone fourni." : "Pas de téléphone."
        } Action recommandée: ${nextAction}.`
      : `Auto-qualified lead (${normalizedScore}/100). Project: ${input.projectType}. ${
          input.phone ? "Phone provided." : "No phone."
        } Recommended action: ${nextAction}.`;

  return {
    score: normalizedScore,
    summary,
    nextAction,
    provider: "heuristic",
  };
}

export async function qualifyLead(input: LeadInput): Promise<LeadQualification> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return heuristicQualification(input);

  try {
    const prompt = `
You are qualifying a contractor-service lead.
Return strict JSON with keys:
- score (0-100 integer)
- summary (max 220 chars)
- nextAction (one of: email_now, send_booking_link, nurture)

Lead:
- name: ${input.name}
- email: ${input.email}
- phone: ${input.phone ?? "none"}
- city: ${input.city ?? "unknown"}
- projectType: ${input.projectType}
- language: ${input.language}
`;

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    if (!res.ok) return heuristicQualification(input);
    const data = (await res.json()) as { output_text?: string };
    const text = data.output_text?.trim();
    if (!text) return heuristicQualification(input);

    const parsed = JSON.parse(text) as {
      score?: number;
      summary?: string;
      nextAction?: "email_now" | "send_booking_link" | "nurture";
    };

    const score = clamp(Math.round(parsed.score ?? 50), 0, 100);
    const summary = (parsed.summary ?? "").slice(0, 220);
    const nextAction = parsed.nextAction ?? (score >= 70 ? "email_now" : "send_booking_link");

    if (!summary) return heuristicQualification(input);

    return {
      score,
      summary,
      nextAction,
      provider: "openai",
    };
  } catch {
    return heuristicQualification(input);
  }
}
