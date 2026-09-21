import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Enter an international phone number.")
  .max(20, "Phone number is too long.")
  .refine((value) => /^\+?[1-9]\d{7,14}$/.test(value.replace(/[\s().-]/g, "")), {
    message: "Use an international phone number, for example +91 98765 43210.",
  });

const sendMessageSchema = z.object({
  recipientPhone: phoneSchema,
  contactName: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1, "Write a message first.").max(4096, "Message is too long."),
});

const conversationSchema = z.object({ conversationId: z.string().uuid() });

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function friendlyProviderError(status: number) {
  if (status === 401 || status === 403) return "WhatsApp connection was rejected. Check the business credentials.";
  if (status === 400) return "WhatsApp rejected this message. Check the number or use an approved template.";
  if (status === 429) return "WhatsApp is temporarily rate-limiting messages. Try again shortly.";
  return "WhatsApp could not accept the message right now. Try again shortly.";
}

function initialsForName(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const getWhatsAppInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error("Could not load WhatsApp conversations.");

    return {
      conversations: data ?? [],
    };
  });

export const getWhatsAppMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => conversationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("user_id", context.userId)
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });

    if (error) throw new Error("Could not load this WhatsApp conversation.");

    return { messages: messages ?? [] };
  });

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => sendMessageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const recipientPhone = normalizePhone(data.recipientPhone);
    const { data: existingConversation, error: conversationLookupError } = await context.supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("user_id", context.userId)
      .eq("phone_number", recipientPhone)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conversationLookupError) throw new Error("Could not prepare the WhatsApp conversation.");

    let conversationId = existingConversation?.id;
    if (!conversationId) {
      const { data: createdConversation, error } = await context.supabase
        .from("whatsapp_conversations")
        .insert({
          user_id: context.userId,
          contact_name: data.contactName,
          phone_number: recipientPhone,
          avatar_initials: data.contactName
            .split(/\s+/)
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        })
        .select("id")
        .single();

      if (error || !createdConversation) throw new Error("Could not create the WhatsApp conversation.");
      conversationId = createdConversation.id;
    }

    const { data: pendingMessage, error: messageInsertError } = await context.supabase
      .from("whatsapp_messages")
      .insert({
        user_id: context.userId,
        conversation_id: conversationId,
        recipient_phone: recipientPhone,
        direction: "outbound",
        message_type: "text",
        body: data.message,
        status: "sending",
      })
      .select("id")
      .single();

    if (messageInsertError || !pendingMessage) throw new Error("Could not queue the WhatsApp message.");

    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    const whatsappApiKey = process.env["WHATSAPP_API_KEY"];
    const metaBaseUrl = process.env["WHATSAPP_API_BASE_URL"];
    const metaPhoneNumberId = process.env["WHATSAPP_PHONE_NUMBER_ID"];

    // Prefer the direct Meta Cloud API when the business credentials are
    // provided; otherwise fall back to the Lovable WhatsApp connector gateway.
    const sendBody = JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: { preview_url: false, body: data.message },
    });

    let requestInit: { url: string; headers: Record<string, string> } | null = null;
    if (whatsappApiKey && metaBaseUrl && metaPhoneNumberId) {
      requestInit = {
        url: `${metaBaseUrl.replace(/\/$/, "")}/${metaPhoneNumberId}/messages`,
        headers: {
          Authorization: `Bearer ${whatsappApiKey}`,
          "Content-Type": "application/json",
        },
      };
    } else if (lovableApiKey && whatsappApiKey) {
      requestInit = {
        url: "https://connector-gateway.lovable.dev/whatsapp/messages",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "X-Connection-Api-Key": whatsappApiKey,
          "Content-Type": "application/json",
        },
      };
    }

    if (!requestInit) {
      const { error } = await context.supabase
        .from("whatsapp_messages")
        .update({ status: "failed", error_reason: "WhatsApp connection is not configured." })
        .eq("id", pendingMessage.id)
        .eq("user_id", context.userId);
      if (error) throw new Error("The message was queued, but its failed status could not be saved.");
      return {
        ok: false,
        conversationId,
        messageId: pendingMessage.id,
        status: "failed",
        errorReason: "WhatsApp connection is not configured.",
      } as const;
    }

    let response: Response;
    let providerMessageId: string | undefined;
    let providerErrorMessage: string | undefined;
    try {
      response = await fetch(requestInit.url, {
        method: "POST",
        headers: requestInit.headers,
        body: sendBody,
      });

      const providerPayload = (await response.json().catch(() => null)) as
        | { messages?: Array<{ id?: string }>; error?: { message?: string } }
        | null;
      providerMessageId = providerPayload?.messages?.[0]?.id;
      providerErrorMessage = providerPayload?.error?.message;
      if (!response.ok && providerErrorMessage) {
        console.error(`WhatsApp send failed [${response.status}]: ${providerErrorMessage}`);
      }
    } catch {
      response = new Response(null, { status: 503 });
    }

    if (!response.ok || !providerMessageId) {
      const errorReason = friendlyProviderError(response.status);
      const { error: failedStatusError } = await context.supabase
        .from("whatsapp_messages")
        .update({ status: "failed", error_reason: errorReason })
        .eq("id", pendingMessage.id)
        .eq("user_id", context.userId);
      if (failedStatusError) throw new Error("WhatsApp failed, but its local status could not be saved.");
      const { error: failedAuditError } = await context.supabase.from("whatsapp_audit_logs").insert({
        user_id: context.userId,
        action: "message_failed",
        recipient_phone: recipientPhone,
        message_id: pendingMessage.id,
        metadata: { provider_status: response.status },
      });
      if (failedAuditError) throw new Error("WhatsApp failed, but its audit record could not be saved.");

      return {
        ok: false,
        conversationId,
        messageId: pendingMessage.id,
        status: "failed",
        errorReason,
      } as const;
    }

    const { error: updateError } = await context.supabase
      .from("whatsapp_messages")
      .update({ status: "sent", provider_message_id: providerMessageId })
      .eq("id", pendingMessage.id)
      .eq("user_id", context.userId);

    if (updateError) throw new Error("WhatsApp sent, but its local status could not be saved.");

    const { error: conversationUpdateError } = await context.supabase
      .from("whatsapp_conversations")
      .update({
        contact_name: data.contactName,
        last_message: data.message,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("user_id", context.userId);
    if (conversationUpdateError) throw new Error("WhatsApp sent, but the conversation preview could not be updated.");

    const { error: auditError } = await context.supabase.from("whatsapp_audit_logs").insert({
      user_id: context.userId,
      action: "message_sent",
      recipient_phone: recipientPhone,
      message_id: pendingMessage.id,
      metadata: { provider_message_id: providerMessageId, message_type: "text" },
    });
    if (auditError) throw new Error("WhatsApp sent, but its audit record could not be saved.");

    return {
      ok: true,
      conversationId,
      messageId: pendingMessage.id,
      status: "sent",
      providerMessageId,
    } as const;
  });