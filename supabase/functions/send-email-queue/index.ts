import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "noreply@trades-canada.com";
const FROM_NAME = "Trades-Canada";
const QUEUE_NAME = "email_queue";
const BATCH_SIZE = 10;
const VISIBILITY_TIMEOUT = 30;

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  template_name: string;
  metadata?: Record<string, unknown>;
}

async function sendEmail(payload: EmailPayload): Promise<{ id: string } | null> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return res.json();
}

Deno.serve(async () => {
  let processed = 0;
  let failed = 0;

  try {
    // Read batch from pgmq
    const { data: messages, error: readError } = await supabase.rpc("read_email_batch", {
      queue_name: QUEUE_NAME,
      batch_size: BATCH_SIZE,
      vt: VISIBILITY_TIMEOUT,
    });

    if (readError) throw readError;
    if (!messages?.length) {
      return new Response(JSON.stringify({ processed: 0, message: "Queue empty" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    for (const msg of messages) {
      const payload = msg.message as EmailPayload;
      const msgId = msg.msg_id;

      try {
        const result = await sendEmail(payload);

        // Log success
        await supabase.from("email_send_log").insert({
          recipient_email: payload.to,
          template_name: payload.template_name,
          status: "sent",
          message_id: result?.id ?? null,
          metadata: payload.metadata ?? null,
        });

        // Delete from queue
        await supabase.rpc("delete_email", { queue_name: QUEUE_NAME, msg_id: msgId });
        processed++;
      } catch (err: any) {
        console.error(`Failed to send email to ${payload.to}:`, err);

        // Log failure
        await supabase.from("email_send_log").insert({
          recipient_email: payload.to,
          template_name: payload.template_name,
          status: "failed",
          error_message: err.message,
          metadata: payload.metadata ?? null,
        });

        // Move to DLQ after 3 attempts
        if (msg.read_ct >= 3) {
          await supabase.rpc("move_to_dlq", { queue_name: QUEUE_NAME, msg_id: msgId });
        }

        failed++;
      }
    }
  } catch (err: any) {
    console.error("Queue processor error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ processed, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});
