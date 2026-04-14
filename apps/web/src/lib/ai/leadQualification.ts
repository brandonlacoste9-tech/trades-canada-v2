import type { ProjectType, PreferredLanguage } from "@/types/database";

type LeadInput = {
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  projectType: ProjectType;
  language: PreferredLanguage;
  permitDescription?: string | null; // Added for deeper context (Opportunity Analysis)
};

export type LeadQualification = {
  score: number;
  summary: string;
  strategy?: string; // High-value advice for the contractor
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
  
  // Complexity bonus for descriptions
  if (input.permitDescription && input.permitDescription.length > 50) score += 10;

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
        }`
      : `Auto-qualified lead (${normalizedScore}/100). Project: ${input.projectType}. ${
          input.phone ? "Phone provided." : "No phone."
        }`;

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
- summary (string, max 150 chars, bilingual: "${input.language}")
- strategy (string, max 300 chars, specific advice on HOW to win this job based on details)
- nextAction (exactly one of: "email_now", "send_booking_link", "nurture")

Lead details:
- name: ${input.name}
- city: ${input.city ?? "unknown"}
- projectType: ${input.projectType}
- permitDetails: ${input.permitDescription ?? "Standard homeowner request"}
- language: ${input.language}

Scoring checklist: phone provided +15, permit depth +10, urgent trade +10. Base 45.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      console.warn(`[leadQualification] OpenAI API error — falling back`);
      return heuristicQualification(input);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) return heuristicQualification(input);

    const parsed = JSON.parse(extractJson(rawText)) as {
      score?: number;
      summary?: string;
      strategy?: string;
      nextAction?: "email_now" | "send_booking_link" | "nurture";
    };

    const score = clamp(Math.round(parsed.score ?? 50), 0, 100);
    const summary = (parsed.summary ?? "").slice(0, 200);
    const strategy = parsed.strategy || undefined;
    
    const validActions = new Set(["email_now", "send_booking_link", "nurture"]);
    const nextAction: LeadQualification["nextAction"] = validActions.has(parsed.nextAction ?? "")
      ? (parsed.nextAction as LeadQualification["nextAction"])
      : score >= 70
      ? "email_now"
      : "send_booking_link";

    return { score, summary, strategy, nextAction, provider: "openai" };
  } catch (err) {
    console.warn("[leadQualification] Error — using fallback:", err);
    return heuristicQualification(input);
  }
}
