import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookRequest } from "@lovable.dev/webhooks-js";
import type { Json, Tables } from "@/integrations/supabase/types";
import {
  handleMetaVerification,
  handleMetaWebhook,
  markEvent,
  processEvent,
  recoverPending,
} from "@/lib/whatsapp-webhook.server";

type WebhookEvent = Tables<"whatsapp_webhook_events">;

// Existing flow: WhatsApp events relayed through the Lovable connector, signed
// with the connector scheme and identified by X-Lovable-Delivery/X-Lovable-Event.
async function handleConnectorWebhook(request: Request, deliveryId: string, eventName: string) {
  const secret = process.env["WHATSAPP_API_KEY"];
  if (!secret) return new Response("WhatsApp webhook is not configured", { status: 500 });

  let payload: unknown;
  try {
    ({ payload } = await verifyWebhookRequest({
      req: request,
      secret,
      maxBodyBytes: 4 * 1024 * 1024,
    }));
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
      await markEvent(
        supabaseAdmin,
        event,
        true,
        error instanceof Error ? error.message : "Processing failed.",
      );
    } catch (markError) {
      console.error("WhatsApp webhook state could not be saved", markError);
      return new Response("Webhook processing state could not be saved", { status: 500 });
    }
    console.error("WhatsApp webhook processing failed", error);
    return Response.json({ ok: false, pending: true }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      // Meta Dashboard webhook subscription handshake (hub.mode/hub.verify_token/hub.challenge).
      GET: async ({ request }) =>
        handleMetaVerification(request, process.env["WHATSAPP_VERIFY_TOKEN"]),

      POST: async ({ request }) => {
        const deliveryId = request.headers.get("X-Lovable-Delivery")?.trim();
        const eventName = request.headers.get("X-Lovable-Event")?.trim();

        // Relayed connector deliveries keep the existing verification path.
        if (deliveryId && eventName) return handleConnectorWebhook(request, deliveryId, eventName);

        // Direct Meta Cloud API deliveries are validated with X-Hub-Signature-256.
        if (request.headers.get("X-Hub-Signature-256")) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          return handleMetaWebhook(supabaseAdmin, request, process.env["WHATSAPP_APP_SECRET"]);
        }

        return new Response("Missing webhook delivery headers", { status: 400 });
      },
    },
  },
});
