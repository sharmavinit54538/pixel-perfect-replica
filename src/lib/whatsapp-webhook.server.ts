// Server-only helpers for the public WhatsApp webhook route.
// Never import this module from client code. Never log secrets, tokens, or authorization headers here.
import type { Json, Tables } from "@/integrations/supabase/types";

type WebhookEvent = Tables<"whatsapp_webhook_events">;
type MetaRecord = Record<string, unknown>;

// Structural subset of the Supabase admin client used by this module. Kept
// loose on purpose: the query API is chainable/dynamic, and the real client
// (src/integrations/supabase/client.server.ts) satisfies this shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbAdmin = { from: (table: string) => any };

const MAX_BODY_BYTES = 4 * 1024 * 1024;

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
  return new Date(
    Date.now() + Math.min(15 * 60_000, 15_000 * 2 ** Math.min(attempt, 5)),
  ).toISOString();
}

function changeValue(payload: unknown) {
  const root = record(payload);
  const entry = record(array(root?.["entry"])[0]);
  const change = record(array(entry?.["changes"])[0]);
  return record(change?.["value"]) ?? {};
}

export async function processStatuses(admin: DbAdmin, value: MetaRecord) {
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
        return [text(error?.["title"]), text(error?.["message"]), text(error?.["code"])]
          .filter(Boolean)
          .join(": ");
      })
      .filter(Boolean)
      .join(" | ");
    const currentRank = statusRank[message.status] ?? 0;
    const nextRank = statusRank[nextStatus] ?? currentRank;
    const update: Record<string, unknown> = {};
    if (nextRank >= currentRank || nextStatus === "failed") update["status"] = nextStatus;
    if (errors) update["error_reason"] = errors;
    const timestamp = providerTimestamp(status?.["timestamp"]);
    if (timestamp && (!message.provider_timestamp || nextRank >= currentRank))
      update["provider_timestamp"] = timestamp;
    if (Object.keys(update).length === 0) continue;
    const { error: updateError } = await admin
      .from("whatsapp_messages")
      .update(update)
      .eq("id", message.id);
    if (updateError) throw updateError;
  }
  return pending;
}

export async function processMessages(admin: DbAdmin, value: MetaRecord) {
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
      // The conversation is created by the outbound flow, where the owning user_id is known.
      // An inbound payload cannot be mapped to a user safely, so processing defers with a retry
      // instead of guessing ownership. The event is recovered by recoverPending once the
      // conversation exists.
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
    const messageBody =
      record(incoming?.["text"])?.["body"] ?? record(incoming?.["image"])?.["caption"] ?? null;
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

    const preview =
      typeof messageBody === "string" ? messageBody : `Received ${messageType} message`;
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

export async function processEvent(admin: DbAdmin, event: WebhookEvent) {
  const value = changeValue(event.payload);
  if (event.event === "whatsapp.status") return processStatuses(admin, value);
  if (event.event === "whatsapp.message") return processMessages(admin, value);
  return false;
}

export async function markEvent(
  admin: DbAdmin,
  event: WebhookEvent,
  pending: boolean,
  errorMessage?: string,
) {
  const attempt = event.attempt_count + 1;
  const update = pending
    ? {
        attempt_count: attempt,
        next_attempt_at: nextRetry(attempt),
        processing_error: errorMessage ?? "Waiting for a matching WhatsApp record.",
      }
    : {
        attempt_count: attempt,
        processed_at: new Date().toISOString(),
        next_attempt_at: new Date().toISOString(),
        processing_error: null,
      };
  const { error } = await admin.from("whatsapp_webhook_events").update(update).eq("id", event.id);
  if (error) throw error;
}

export async function recoverPending(admin: DbAdmin, skipId: string) {
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
      await markEvent(
        admin,
        pendingEvent,
        true,
        error instanceof Error ? error.message : "Processing failed.",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Meta webhook verification (direct Meta Dashboard → this endpoint)
// ---------------------------------------------------------------------------

function toHex(buffer: ArrayBuffer) {
  let output = "";
  for (const byte of new Uint8Array(buffer)) output += byte.toString(16).padStart(2, "0");
  return output;
}

// Constant-time comparison for equal-length digests. Inputs must already be
// fixed-length values (hex digests) so the length check leaks nothing useful.
function hexDigestEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function sha256Hex(input: string) {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)));
}

// Compares a caller-supplied token against the configured verify token without
// a timing oracle: both sides are hashed to fixed-length digests first.
export async function tokensMatch(suppliedToken: string, configuredToken: string) {
  const [supplied, configured] = await Promise.all([
    sha256Hex(suppliedToken),
    sha256Hex(configuredToken),
  ]);
  return hexDigestEqual(supplied, configured);
}

const META_SIGNATURE_PATTERN = /^sha256=([0-9a-f]{64})$/i;

// Validates Meta's X-Hub-Signature-256 header: HMAC-SHA256 of the RAW request
// body keyed with the Meta App Secret. The secret is used only as the HMAC key
// and is never logged or returned.
export async function metaSignatureValid(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
) {
  if (!signatureHeader || !appSecret) return false;
  const match = META_SIGNATURE_PATTERN.exec(signatureHeader.trim());
  const provided = match?.[1]?.toLowerCase();
  if (!provided) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return hexDigestEqual(toHex(digest), provided);
}

// Meta's GET handshake. Returns hub.challenge ONLY when hub.mode is "subscribe"
// and hub.verify_token matches the configured token.
export async function handleMetaVerification(
  request: Request,
  configuredToken: string | undefined,
) {
  if (!configuredToken)
    return new Response("WhatsApp webhook verification is not configured", { status: 500 });

  const params = new URL(request.url).searchParams;
  if (params.get("hub.mode") !== "subscribe")
    return new Response("Unsupported hub.mode", { status: 400 });

  const suppliedToken = params.get("hub.verify_token") ?? "";
  if (!suppliedToken || !(await tokensMatch(suppliedToken, configuredToken))) {
    return new Response("Verification token mismatch", { status: 403 });
  }

  const challenge = params.get("hub.challenge");
  if (!challenge) return new Response("Missing hub.challenge", { status: 400 });

  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export type MetaChange = {
  index: number;
  value: MetaRecord;
  // A synthesized single-change payload so processEvent/changeValue sees exactly this change.
  payload: MetaRecord;
};

// A direct Meta POST can batch several entries/changes. Direct POSTs also have
// no delivery id or event header from a relay, so each change becomes its own
// whatsapp_webhook_events row keyed by "<rawBodyHash>:<changeIndex>".
export function collectMetaChanges(payload: unknown): MetaChange[] {
  const root = record(payload);
  if (!root) return [];
  const changes: MetaChange[] = [];
  let index = 0;
  for (const rawEntry of array(root["entry"])) {
    const entry = record(rawEntry);
    if (!entry) continue;
    const entryId = text(entry["id"]);
    for (const rawChange of array(entry["changes"])) {
      const change = record(rawChange);
      if (!change) continue;
      changes.push({
        index,
        value: record(change["value"]) ?? {},
        payload: { object: root["object"], entry: [{ id: entryId, changes: [change] }] },
      });
      index += 1;
    }
  }
  return changes;
}

export function metaEventName(value: MetaRecord) {
  if (array(value["messages"]).length > 0) return "whatsapp.message";
  if (array(value["statuses"]).length > 0) return "whatsapp.status";
  return "whatsapp.event";
}

// Handles a direct Meta webhook POST end-to-end: signature validation,
// idempotent event storage, processing, and pending-event recovery.
// Meta only stops retrying on HTTP 200, so unsupported-but-valid payloads are
// acknowledged (marked processed via the "whatsapp.event" no-op path), while
// real processing failures return 500 so Meta redelivers.
export async function handleMetaWebhook(
  admin: DbAdmin,
  request: Request,
  appSecret: string | undefined,
) {
  if (!appSecret)
    return new Response("WhatsApp webhook signature validation is not configured", { status: 500 });

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return new Response("Webhook payload too large", { status: 413 });
  }

  if (!(await metaSignatureValid(rawBody, request.headers.get("X-Hub-Signature-256"), appSecret))) {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid webhook payload", { status: 400 });
  }

  const changes = collectMetaChanges(payload);
  if (changes.length === 0) return Response.json({ ok: true, ignored: true });

  const bodyHash = await sha256Hex(rawBody);
  let pending = false;
  let processedAny = false;
  let lastEventId = "";

  for (const change of changes) {
    const deliveryId = `meta:${bodyHash}:${change.index}`;
    const { data: existing, error: existingError } = await admin
      .from("whatsapp_webhook_events")
      .select("*")
      .eq("delivery_id", deliveryId)
      .maybeSingle();
    if (existingError) return new Response("Webhook inbox unavailable", { status: 500 });
    if (existing?.processed_at) continue; // Meta redelivery of a handled event — idempotent skip.

    let event = existing as WebhookEvent | null;
    if (!event) {
      const { data: inserted, error: insertError } = await admin
        .from("whatsapp_webhook_events")
        .insert({
          delivery_id: deliveryId,
          event: metaEventName(change.value),
          payload: change.payload as Json,
        })
        .select("*")
        .single();
      if (insertError) {
        const { data: racedEvent } = await admin
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
      const isPending = await processEvent(admin, event);
      await markEvent(admin, event, isPending);
      pending = pending || isPending;
      processedAny = true;
      lastEventId = event.id;
    } catch (error) {
      try {
        await markEvent(
          admin,
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

  if (processedAny && lastEventId) {
    try {
      await recoverPending(admin, lastEventId);
    } catch (error) {
      // Processed events are already stored processed_at, so a redelivery skips
      // them cleanly; tell Meta to retry so recovery completes.
      console.error("WhatsApp webhook recovery failed", error);
      return Response.json({ ok: false, pending: true }, { status: 500 });
    }
  }

  return Response.json({ ok: true, pending, duplicate: !processedAny });
}
