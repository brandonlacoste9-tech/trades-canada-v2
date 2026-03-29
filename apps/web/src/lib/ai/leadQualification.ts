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
  if (
    input.projectType === "roofing" ||
    input.projectType === "hvac" ||
    input.projectType === "electrical"
  ) {
    score += 5;
  }

  const normalizedScore = clamp(score, 10, 95);
  const nextAction: LeadQualification["nextAction"] =
    normalizedScore >= 75
      ? "email_now"
      : normalizedScore >= 60
      ? "send_booking_link"
      : "nurture";

  const summary =
    input.language === "fr"
      ? `Lead auto-qualifié (${normalizedScore}/100). Projet: ${input.projectType}. ${
          input.phone ? "Téléphone fourni." : "Pas de téléphone."
        } Action recommandée: ${nextAction}.`
      : `Auto-qualified lead (${normalizedScore}/100). Project: ${input.projectType}. ${
          input.phone ? "Phone provided." : "No phone."
        } Recommended action: ${nextAction}.`;

  return { score: normalizedScore, summary, nextAction, provider: "heuristic" };
}

/** Extract JSON from a string that may contain markdown fences */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const braced = text.match(/\{[\s\S]*\}/);
  if (braced) return braced[0];
  return text.trim();
}

export async function qualifyLead(input: LeadInput): Promise<LeadQualification> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return heuristicQualification(input);

  const prompt = `You are qualifying a contractor-service lead for the Canadian trades market.
Return ONLY strict JSON with these exact keys:
- score (integer 0-100)
- summary (string, max 220 chars, bilingual context: language is "${input.language}")
- nextAction (exactly one of: "email_now", "send_booking_link", "nurture")

Lead details:
- name: ${input.name}
- email: ${input.email}
- phone: ${input.phone ?? "none"}
- city: ${input.city ?? "unknown"}
- projectType: ${input.projectType}
- language: ${input.language}

Scoring guide: phone provided +15, city known +10, non-other trade +10, urgent trade (hvac/roofing/electrical) +5. Base 45.`;

  try {
    // Try OpenAI Responses API (gpt-4.1-mini)
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      console.warn(`[leadQualification] OpenAI API ${res.status} — falling back to heuristic`);
      return heuristicQualification(input);
    }

    const data = (await res.json()) as {
      output_text?: string;
      output?: Array<{ type: string; text?: string; content?: Array<{ type: string; text?: string }> }>;
    };

    // Handle both Responses API formats
    const rawText: string | undefined =
      data.output_text ??
      data.output?.find((o) => o.type === "message")?.content?.find((c) => c.type === "output_text")?.text ??
      data.output?.find((o) => o.type === "message")?.text;

    if (!rawText) return heuristicQualification(input);

    const parsed = JSON.parse(extractJson(rawText)) as {
      score?: number;
      summary?: string;
      nextAction?: "email_now" | "send_booking_link" | "nurture";
    };

    const score = clamp(Math.round(parsed.score ?? 50), 0, 100);
    const summary = (parsed.summary ?? "").slice(0, 220);
    const validActions = new Set(["email_now", "send_booking_link", "nurture"]);
    const nextAction: LeadQualification["nextAction"] = validActions.has(parsed.nextAction ?? "")
      ? (parsed.nextAction as LeadQualification["nextAction"])
      : score >= 70
      ? "email_now"
      : "send_booking_link";

    if (!summary) return heuristicQualification(input);

    return { score, summary, nextAction, provider: "openai" };
  } catch (err) {
    console.warn("[leadQualification] Parse/fetch error — using heuristic:", err);
    return heuristicQualification(input);
  }
}
