
import { createClient } from "@supabase/supabase-js";

/**
 * Sends a notification to a contractor's Telegram chat if they have connected it.
 * Used for instant lead alerts 
 */
export async function sendTelegramNotification(userId: string, message: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to read/update profiles
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch user's telegram_chat_id
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("telegram_chat_id")
    .eq("id", userId)
    .single();

  if (error || !profile?.telegram_chat_id) {
    console.log(`[telegram] No chat ID for user ${userId}, skipping notification.`);
    return false;
  }

  // 2. Fetch bot token (should be in env vars)
  // In production, each project has its own bot, but we use a central one for the platform.
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not configured.");
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: profile.telegram_chat_id,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[telegram] API error:", err);
      return false;
    }

    // 3. Log the successful notification
    await supabase.from("automated_logs").insert({
      event_type: "telegram_notification_sent",
      channel: "telegram",
      status: "sent",
      subject: "Instant Lead Alert",
      metadata: { userId, messageLength: message.length }
    });

    return true;
  } catch (err) {
    console.error("[telegram] Fetch failed:", err);
    return false;
  }
}

/**
 * Formats a lead message for Telegram with premium branding
 */
export function formatLeadTelegramMessage(lead: {
  id: string,
  city: string,
  projectType: string,
  value?: string | number,
  source: string,
  title?: string
}, lang: "en" | "fr" = "en") {
  const title = lang === "en" ? "🚀 NEW PREMIUM LEAD AVAILABLE" : "🚀 NOUVEAU LEAD PREMIUM DISPONIBLE";
  const cityLabel = lang === "en" ? "Location" : "Emplacement";
  const typeLabel = lang === "en" ? "Trade" : "Métier";
  const valueLabel = lang === "en" ? "Est. Value" : "Valeur est.";
  const cta = lang === "en" ? "Unlock in Dashboard" : "Déverrouiller dans le tableau de bord";
  
  const dashboardUrl = `https://trades-canada.com/${lang}/dashboard`;

  return `
<b>${title}</b>

🏠 <b>${cityLabel}:</b> ${lead.city}
🛠️ <b>${typeLabel}:</b> ${lead.projectType.toUpperCase()}
💰 <b>${valueLabel}:</b> ${lead.value || "TBD"}
📡 <b>Source:</b> ${lead.source}

${lead.title ? `<i>"${lead.title}"</i>\n` : ""}
<a href="${dashboardUrl}">${cta} →</a>
  `.trim();
}
