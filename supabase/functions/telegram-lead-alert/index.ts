import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

async function sendTelegramMessage(chatId: string, text: string, customToken?: string): Promise<boolean> {
  const token = customToken || TELEGRAM_BOT_TOKEN;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const data = await res.json();
  if (!data.ok) {
    console.warn(`Telegram API error (${token.substring(0, 5)}...):`, data.description);
  }
  return data.ok;
}

Deno.serve(async (req) => {
  try {
    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id required");

    // Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) throw new Error("Lead not found");

    // Find contractors who should receive this alert
    // Match by city and services
    const { data: contractors } = await supabase
      .from("profiles")
      .select("id, telegram_chat_id, telegram_bot_token, display_name, services, subscription_tier")
      .not("telegram_chat_id", "is", null)
      .not("subscription_tier", "is", null);

    if (!contractors?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
    }

    let sent = 0;
    const isFr = lead.language === "fr";

    for (const contractor of contractors) {
      if (!contractor.telegram_chat_id) continue;

      // Check service match
      const services = contractor.services ?? [];
      const projectType = lead.project_type?.replace("_", " ") ?? "";
      const matches = services.length === 0 || services.some((s: string) =>
        s.toLowerCase().includes(projectType.toLowerCase()) ||
        projectType.toLowerCase().includes(s.toLowerCase())
      );

      if (!matches) continue;

      const scoreEmoji = (lead.score ?? 0) >= 80 ? "🔥" : (lead.score ?? 0) >= 60 ? "⚡" : "📋";

      const message = isFr
        ? `${scoreEmoji} <b>Nouveau Lead — Trades-Canada</b>\n\n` +
          `👤 <b>Nom:</b> ${lead.name}\n` +
          `🏗️ <b>Projet:</b> ${projectType}\n` +
          `📍 <b>Ville:</b> ${lead.city ?? "Non spécifiée"}\n` +
          `⭐ <b>Score:</b> ${lead.score ?? "N/A"}\n\n` +
          `📊 <i>Connectez-vous à votre tableau de bord pour réclamer ce lead.</i>`
        : `${scoreEmoji} <b>New Lead — Trades-Canada</b>\n\n` +
          `👤 <b>Name:</b> ${lead.name}\n` +
          `🏗️ <b>Project:</b> ${projectType}\n` +
          `📍 <b>City:</b> ${lead.city ?? "Not specified"}\n` +
          `⭐ <b>Score:</b> ${lead.score ?? "N/A"}\n\n` +
          `📊 <i>Log in to your dashboard to claim this lead.</i>`;

      const success = await sendTelegramMessage(
        contractor.telegram_chat_id,
        message,
        contractor.telegram_bot_token ?? undefined
      );

      if (success) {
        sent++;
        await supabase.from("automated_logs").insert({
          event_type: "lead.telegram_alert",
          channel: "telegram",
          status: "sent",
          lead_id: lead.id,
          recipient: contractor.id,
          subject: `Lead alert sent to ${contractor.display_name ?? contractor.id}`,
        });
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Telegram alert error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
