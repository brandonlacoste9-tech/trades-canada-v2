import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    
    // Check if it's a message
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id.toString();
      const text = body.message.text.trim().toUpperCase();

      // Look for a verification code pattern (e.g. TC-XXXXXX)
      // Or just a 6-digit alphanum code if that's what we generate
      const codeMatch = text.match(/[A-Z0-9]{6}/);
      
      if (codeMatch) {
        const code = codeMatch[0];
        
        // Find the profile with this code
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, display_name")
          .eq("telegram_verification_code", code)
          .single();

        if (profile && !error) {
          // Update the chat ID and clear the code
          await supabase
            .from("profiles")
            .update({
              telegram_chat_id: chatId,
              telegram_verification_code: null,
            })
            .eq("id", profile.id);

          // Confirm to the user on Telegram
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `✅ Success! Your account (${profile.display_name || "Contractor"}) is now linked to Trades-Canada. You will receive lead alerts here moving forward.`,
            }),
          });
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
});
