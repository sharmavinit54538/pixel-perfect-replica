import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookRequest } from "@lovable.dev/webhooks-js";
import type { Json, Tables } from "@/integrations/supabase/types";

type WebhookEvent = Tables<"whatsapp_webhook_events">;
type MessageRow = Tables<"whatsapp_messages">;
type ConversationRow = Tables<"whatsapp_conversations">;
type MetaRecord = Record<string, unknown>;

const statusRank: Record<string, number> = {
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 4,
};

function record(value: unknown): MetaRecord | null {
  return value !== null && typeof value === "object" ? (value as MetaRecord) : null;
}

function array(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function providerTimestamp(value: unknown) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function nextRetry(attempt: number) {
  return new Date(Date.now() + Math.min(15 * 60_000, 15_000 * 2 ** Math.min(attempt, 5))).toISOString();
}

function changeValue(payload: unknown) {
  const root = record(payload);
  const entry = record(array(root?.["entry"])[0]);
  const change = record(array(entry?.["changes"])[0]);
  return record(change?.["value"]) ?? {};
}

async function processStatuses(admin: any, value: MetaRecord) {
  let pending = false;
  for (const rawStatus of array(value["statuses"])) {
    const status = record(rawStatus);
    const providerId = text(status?.["id"]);
    const nextStatus = text(status?.["status"]);
    if (!providerId || !nextStatus) continue;

    const { data: message, error: lookupError } = await admin
      .from("whatsapp_messages")
      .select("id, status, provider_timestamp")
      .eq("provider_message_id", providerId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!message) {
      pending = true;
      continue;
    }

    const errors = array(status?.["errors"])
      .map((item) => {
        const error = record(item);
        return [text(error?.["title"]), text(error?.["message"]), text(error?.["code"])].filter(Boolean).join(": ");
      })
      .filter(Boolean)
      .join(" | ");
    const currentRank = statusRank[message.status] ?? 0;
    const nextRank = statusRank[nextStatus] ?? currentRank;
    const update: Record<string, unknown> = {};
    if (nextRank >= currentRank || nextStatus === "failed") update["status"] = nextStatus;
    if (errors) update["error_reason"] = errors;
    const timestamp = providerTimestamp(status?.["timestamp"]);
    if (timestamp && (!message.provider_timestamp || nextRank >= currentRank)) update["provider_timestamp"] = timestamp;
    if (Object.keys(update).length === 0) continue;
    const { error: updateError } = await admin.from("whatsapp_messages").update(update).eq("id", message.id);
    if (updateError) throw updateError;
  }
  return pending;
}

async function processMessages(admin: any, value: MetaRecord) {
  let pending = false;
  for (const rawMessage of array(value["messages"])) {
    const incoming = record(rawMessage);
    const providerId = text(incoming?.["id"]);
    const from = phoneDigits(text(incoming?.["from"]));
    if (!providerId || !from) continue;

    const { data: conversation, error: conversationError } = await admin
      .from("whatsapp_conversations")
      .select("id, user_id, contact_name, unread_count")
      .eq("phone_number", from)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation) {
      pending = true;
      continue;
    }

    const { data: existing, error: existingError } = await admin
      .from("whatsapp_messages")
      .select("id")
      .eq("provider_message_id", providerId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) continue;

    const messageType = text(incoming?.["type"]) || "text";
    const messageBody = record(incoming?.["text"])?.["body"] ?? record(incoming?.["image"])?.["caption"] ?? null;
    const { error: insertError } = await admin.from("whatsapp_messages").insert({
      user_id: conversation.user_id,
      conversation_id: conversation.id,
      provider_message_id: providerId,
      direction: "inbound",
      message_type: messageType,
      recipient_phone: from,
      body: typeof messageBody === "string" ? messageBody : null,
      status: "delivered",
      provider_timestamp: providerTimestamp(incoming?.["timestamp"]),
    });
    if (insertError) throw insertError;

    const preview = typeof messageBody === "string" ? messageBody : `Received ${messageType} message`;
    const { error: conversationUpdateError } = await admin
      .from("whatsapp_conversations")
      .update({
        last_message: preview,
        last_message_at: new Date().toISOString(),
        unread_count: (conversation.unread_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);
    if (conversationUpdateError) throw conversationUpdateError;
  }
  return pending;
}

async function processEvent(admin: any, event: WebhookEvent) {
  const value = changeValue(event.payload);
  if (event.event === "whatsapp.status") return processStatuses(admin, value);
  if (event.event === "whatsapp.message") return processMessages(admin, value);
  return false;
}

async function markEvent(admin: any, event: WebhookEvent, pending: boolean, errorMessage?: string) {
  const attempt = event.attempt_count + 1;
  const update = pending
    ? { attempt_count: attempt, next_attempt_at: nextRetry(attempt), processing_error: errorMessage ?? "Waiting for a matching WhatsApp record." }
    : { attempt_count: attempt, processed_at: new Date().toISOString(), next_attempt_at: new Date().toISOString(), processing_error: null };
  const { error } = await admin.from("whatsapp_webhook_events").update(update).eq("id", event.id);
  if (error) throw error;
}

async function recoverPending(admin: any, skipId: string) {
  const { data: pendingEvents, error } = await admin
    .from("whatsapp_webhook_events")
    .select("*")
    .is("processed_at", null)
    .neq("id", skipId)
    .lte("next_attempt_at", new Date().toISOString())
    .lt("attempt_count", 6)
    .order("next_attempt_at", { ascending: true })
    .order("received_at", { ascending: true })
    .limit(10);
  if (error) throw error;
  for (const pendingEvent of (pendingEvents ?? []) as WebhookEvent[]) {
    try {
      const isStillPending = await processEvent(admin, pendingEvent);
      await markEvent(admin, pendingEvent, isStillPending);
    } catch (error) {
      await markEvent(admin, pendingEvent, true, error instanceof Error ? error.message : "Processing failed.");
    }
  }
}

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const deliveryId = request.headers.get("X-Lovable-Delivery")?.trim();
        const eventName = request.headers.get("X-Lovable-Event")?.trim();
        const secret = process.env["WHATSAPP_API_KEY"];
        if (!deliveryId || !eventName) return new Response("Missing webhook delivery headers", { status: 400 });
        if (!secret) return new Response("WhatsApp webhook is not configured", { status: 500 });

        let payload: unknown;
        try {
          ({ payload } = await verifyWebhookRequest({ req: request, secret, maxBodyBytes: 4 * 1024 * 1024 }));
        } catch {
          return new Response("Invalid webhook signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: existing, error: existingError } = await supabaseAdmin
          .from("whatsapp_webhook_events")
          .select("*")
          .eq("delivery_id", deliveryId)
          .maybeSingle();
        if (existingError) return new Response("Webhook inbox unavailable", { status: 500 });
        if (existing?.processed_at) return Response.json({ ok: true, duplicate: true });

        let event = existing as WebhookEvent | null;
        if (!event) {
          const { data: inserted, error: insertError } = await supabaseAdmin
            .from("whatsapp_webhook_events")
            .insert({ delivery_id: deliveryId, event: eventName, payload: payload as Json })
            .select("*")
            .single();
          if (insertError) {
            const { data: racedEvent } = await supabaseAdmin
              .from("whatsapp_webhook_events")
              .select("*")
              .eq("delivery_id", deliveryId)
              .maybeSingle();
            if (!racedEvent) return new Response("Webhook could not be stored", { status: 500 });
            event = racedEvent as WebhookEvent;
          } else {
            event = inserted as WebhookEvent;
          }
        }

        try {
          const pending = await processEvent(supabaseAdmin, event);
          await markEvent(supabaseAdmin, event, pending);
          await recoverPending(supabaseAdmin, event.id);
          return Response.json({ ok: true, pending });
        } catch (error) {
          try {
            await markEvent(supabaseAdmin, event, true, error instanceof Error ? error.message : "Processing failed.");
          } catch (markError) {
            console.error("WhatsApp webhook state could not be saved", markError);
            return new Response("Webhook processing state could not be saved", { status: 500 });
          }
          console.error("WhatsApp webhook processing failed", error);
          return Response.json({ ok: true, pending: true });
        }
      },
    },
  },
});