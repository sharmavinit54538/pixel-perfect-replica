/* eslint-disable @typescript-eslint/no-explicit-any -- the in-memory mock mirrors the dynamic supabase-js chain API. */
import { describe, expect, it } from "vitest";
import {
  collectMetaChanges,
  handleMetaVerification,
  handleMetaWebhook,
  metaEventName,
  metaSignatureValid,
  tokensMatch,
} from "@/lib/whatsapp-webhook.server";

// ---------------------------------------------------------------------------
// In-memory fake of the Supabase admin query API used by the webhook module.
// ---------------------------------------------------------------------------

type Row = any;

const WEBHOOK_EVENTS = "whatsapp_webhook_events";
const CONVERSATIONS = "whatsapp_conversations";
const MESSAGES = "whatsapp_messages";

let rowCounter = 0;
function nextId(prefix: string) {
  rowCounter += 1;
  return `${prefix}-${rowCounter}`;
}

function rowMatches(row: Row, filters: Array<(row: Row) => boolean>) {
  return filters.every((filter) => filter(row));
}

class FakeQuery {
  private filters: Array<(row: Row) => boolean> = [];
  private sorts: Array<{ column: string; ascending: boolean }> = [];
  private limitCount: number | null = null;
  private mode: "select" | "insert" | "update" = "select";
  private queuedInsert: Row[] = [];
  private queuedUpdate: Row = {};

  constructor(
    private tables: Record<string, Row[]>,
    private table: string,
  ) {}

  select(_columns?: string) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((row) =>
      value === null ? row[column] === null || row[column] === undefined : row[column] === value,
    );
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push((row) => row[column] < value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sorts.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  insert(values: Row | Row[]) {
    this.mode = "insert";
    this.queuedInsert = Array.isArray(values) ? values : [values];
    return this;
  }

  update(values: Row) {
    this.mode = "update";
    this.queuedUpdate = values;
    return this;
  }

  private matchingRows() {
    const rows = this.tables[this.table]!.filter((row) => rowMatches(row, this.filters));
    rows.sort((a, b) => {
      for (const sort of this.sorts) {
        if (a[sort.column] < b[sort.column]) return sort.ascending ? -1 : 1;
        if (a[sort.column] > b[sort.column]) return sort.ascending ? 1 : -1;
      }
      return 0;
    });
    return this.limitCount === null ? rows : rows.slice(0, this.limitCount);
  }

  private execute(): { data: any; error: any } {
    const tableRows = this.tables[this.table]!;
    if (this.mode === "insert") {
      const inserted: Row[] = [];
      for (const values of this.queuedInsert) {
        if (
          this.table === WEBHOOK_EVENTS &&
          tableRows.some((row) => row.delivery_id === values.delivery_id)
        ) {
          return {
            data: null,
            error: { code: "23505", message: "duplicate key value violates unique constraint" },
          };
        }
        const row: Row = { ...values };
        if (this.table === WEBHOOK_EVENTS) {
          row.id = row.id ?? nextId("evt");
          row.attempt_count = row.attempt_count ?? 0;
          row.next_attempt_at = row.next_attempt_at ?? new Date().toISOString();
          row.received_at = row.received_at ?? new Date().toISOString();
          row.processed_at = row.processed_at ?? null;
          row.processing_error = row.processing_error ?? null;
        }
        if (this.table === MESSAGES) {
          row.id = row.id ?? nextId("msg");
          row.created_at = row.created_at ?? new Date().toISOString();
          row.updated_at = row.updated_at ?? new Date().toISOString();
        }
        tableRows.push(row);
        inserted.push(row);
      }
      return { data: inserted, error: null };
    }
    if (this.mode === "update") {
      const updated = this.matchingRows();
      for (const row of updated) Object.assign(row, this.queuedUpdate);
      return { data: updated, error: null };
    }
    return { data: this.matchingRows(), error: null };
  }

  // Plain `await query` support, mirroring supabase-js thenables.
  then(
    resolve: (value: { data: any; error: any }) => unknown,
    reject?: (reason: unknown) => unknown,
  ) {
    return Promise.resolve(this.execute()).then(resolve, reject);
  }

  maybeSingle() {
    const { data, error } = this.execute();
    if (error) return Promise.resolve({ data: null, error });
    const row = Array.isArray(data) ? (data[0] ?? null) : data;
    return Promise.resolve({ data: row ?? null, error: null });
  }

  single() {
    const { data, error } = this.execute();
    if (error) return Promise.resolve({ data: null, error });
    const row = Array.isArray(data) ? (data[0] ?? null) : data;
    if (!row) return Promise.resolve({ data: null, error: { message: "Results contain 0 rows" } });
    return Promise.resolve({ data: row, error: null });
  }
}

function createFakeAdmin(seed?: { conversations?: Row[]; messages?: Row[]; events?: Row[] }) {
  const tables: Record<string, Row[]> = {
    [WEBHOOK_EVENTS]: seed?.events ?? [],
    [CONVERSATIONS]: seed?.conversations ?? [],
    [MESSAGES]: seed?.messages ?? [],
  };
  return {
    admin: { from: (table: string) => new FakeQuery(tables, table) },
    tables,
  };
}

// ---------------------------------------------------------------------------
// Payload / request helpers
// ---------------------------------------------------------------------------

const APP_SECRET = "test-app-secret-not-a-real-credential";
const VERIFY_TOKEN = "test-verify-token-not-a-real-credential";

async function sign(body: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function metaPostRequest(body: string, secret = APP_SECRET) {
  const signature = await sign(body, secret);
  return new Request("https://app.example/api/public/whatsapp/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Hub-Signature-256": `sha256=${signature}` },
    body,
  });
}

const NOW = "2026-09-25T10:00:00.000Z";

function seedConversation(overrides: Row = {}): Row {
  return {
    id: "conv-1",
    user_id: "user-1",
    contact_name: "Ramesh Kumar",
    phone_number: "919351608590",
    avatar_initials: "RK",
    last_message: "Previous message",
    last_message_at: NOW,
    unread_count: 3,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function inboundPayload(overrides: Row = {}) {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "123456789012345",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "919876543210", phone_number_id: "9988776655" },
              contacts: [{ profile: { name: "Ramesh Kumar" }, wa_id: "919351608590" }],
              messages: [
                {
                  from: "919351608590",
                  id: "wamid.HBgMOTE5MzUxNjA4NTkwFQIAERgSMDEyMzQ1Njc4OTABCAA=",
                  timestamp: "1790282400",
                  type: "text",
                  text: { body: "Is the 2BHK still available?" },
                },
              ],
              ...overrides,
            },
          },
        ],
      },
    ],
  });
}

function statusPayload(providerId = "wamid.OUTBOUND-1", status = "delivered") {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "123456789012345",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "919876543210", phone_number_id: "9988776655" },
              statuses: [
                { id: providerId, status, timestamp: "1790282460", recipient_id: "919351608590" },
              ],
            },
          },
        ],
      },
    ],
  });
}

function seedOutboundMessage(overrides: Row = {}): Row {
  return {
    id: "msg-out-1",
    user_id: "user-1",
    conversation_id: "conv-1",
    provider_message_id: "wamid.OUTBOUND-1",
    direction: "outbound",
    message_type: "text",
    recipient_phone: "919351608590",
    body: "Hello from the builder",
    status: "sent",
    error_reason: null,
    provider_timestamp: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// GET verification handshake
// ---------------------------------------------------------------------------

describe("Meta GET verification handshake", () => {
  const url = (params: Record<string, string>) =>
    `https://app.example/api/public/whatsapp/webhook?${new URLSearchParams(params).toString()}`;

  it("returns hub.challenge with 200 for a valid subscribe request", async () => {
    const request = new Request(
      url({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "challenge-42-xyz",
      }),
    );
    const response = await handleMetaVerification(request, VERIFY_TOKEN);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(await response.text()).toBe("challenge-42-xyz");
  });

  it("rejects an invalid verify token with 403", async () => {
    const request = new Request(
      url({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong-token",
        "hub.challenge": "challenge-42-xyz",
      }),
    );
    const response = await handleMetaVerification(request, VERIFY_TOKEN);
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain("challenge-42-xyz");
  });

  it("rejects a missing verify token with 403", async () => {
    const request = new Request(
      url({ "hub.mode": "subscribe", "hub.challenge": "challenge-42-xyz" }),
    );
    const response = await handleMetaVerification(request, VERIFY_TOKEN);
    expect(response.status).toBe(403);
  });

  it("rejects an unsupported hub.mode with 400 (even with a valid token)", async () => {
    const request = new Request(
      url({
        "hub.mode": "unsubscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "challenge-42-xyz",
      }),
    );
    const response = await handleMetaVerification(request, VERIFY_TOKEN);
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("challenge-42-xyz");
  });

  it("rejects a valid request that is missing hub.challenge with 400", async () => {
    const request = new Request(url({ "hub.mode": "subscribe", "hub.verify_token": VERIFY_TOKEN }));
    const response = await handleMetaVerification(request, VERIFY_TOKEN);
    expect(response.status).toBe(400);
  });

  it("rejects verification when the server token is not configured with 500", async () => {
    const request = new Request(
      url({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "challenge-42-xyz",
      }),
    );
    const response = await handleMetaVerification(request, undefined);
    expect(response.status).toBe(500);
  });

  it("matches tokens without leaking length (timing-safe compare path)", async () => {
    expect(await tokensMatch("abc", VERIFY_TOKEN)).toBe(false);
    expect(await tokensMatch(VERIFY_TOKEN, VERIFY_TOKEN)).toBe(true);
    expect(await tokensMatch(`${VERIFY_TOKEN}x`, VERIFY_TOKEN)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// X-Hub-Signature-256 validation
// ---------------------------------------------------------------------------

describe("Meta X-Hub-Signature-256 validation", () => {
  it("accepts a correctly signed body", async () => {
    const body = inboundPayload();
    expect(
      await metaSignatureValid(body, `sha256=${await sign(body, APP_SECRET)}`, APP_SECRET),
    ).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const body = inboundPayload();
    const signature = await sign(body, APP_SECRET);
    expect(await metaSignatureValid(`${body} `, `sha256=${signature}`, APP_SECRET)).toBe(false);
  });

  it("rejects a signature made with the wrong secret", async () => {
    const body = inboundPayload();
    const signature = await sign(body, "some-other-secret");
    expect(await metaSignatureValid(body, `sha256=${signature}`, APP_SECRET)).toBe(false);
  });

  it("rejects malformed or missing signature headers", async () => {
    const body = inboundPayload();
    const signature = await sign(body, APP_SECRET);
    expect(await metaSignatureValid(body, null, APP_SECRET)).toBe(false);
    expect(await metaSignatureValid(body, "", APP_SECRET)).toBe(false);
    expect(await metaSignatureValid(body, `sha1=${signature}`, APP_SECRET)).toBe(false);
    expect(await metaSignatureValid(body, "sha256=not-hex", APP_SECRET)).toBe(false);
    expect(await metaSignatureValid(body, `sha256=${signature.toUpperCase()}`, APP_SECRET)).toBe(
      true,
    ); // hex case-insensitive
    expect(await metaSignatureValid(body, ` sha256=${signature} `, APP_SECRET)).toBe(true); // surrounding whitespace tolerated
  });
});

// ---------------------------------------------------------------------------
// Payload parsing helpers
// ---------------------------------------------------------------------------

describe("Meta payload change collection", () => {
  it("splits batched entries/changes into single-change payloads", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "1",
          changes: [
            { field: "messages", value: { messages: [{ id: "a" }] } },
            { field: "messages", value: { statuses: [{ id: "b" }] } },
          ],
        },
        { id: "2", changes: [{ field: "messages", value: { messages: [{ id: "c" }] } }] },
      ],
    };
    const changes = collectMetaChanges(payload);
    expect(changes).toHaveLength(3);
    expect(changes.map((change) => change.index)).toEqual([0, 1, 2]);
    expect(metaEventName(changes[0]!.value)).toBe("whatsapp.message");
    expect(metaEventName(changes[1]!.value)).toBe("whatsapp.status");
    expect(metaEventName(changes[2]!.value)).toBe("whatsapp.message");
    // Each synthesized payload isolates exactly one change for processEvent/changeValue.
    expect((changes[1]!.payload["entry"] as any[])[0].changes).toHaveLength(1);
  });

  it("returns an empty list for payloads without changes", () => {
    expect(collectMetaChanges({})).toHaveLength(0);
    expect(collectMetaChanges(null)).toHaveLength(0);
    expect(collectMetaChanges("nope")).toHaveLength(0);
    expect(collectMetaChanges({ object: "instagram", entry: [] })).toHaveLength(0);
  });

  it("classifies unsupported changes as a safe no-op event", () => {
    expect(metaEventName({})).toBe("whatsapp.event");
    expect(metaEventName({ messaging_product: "whatsapp" })).toBe("whatsapp.event");
  });
});

// ---------------------------------------------------------------------------
// Direct Meta webhook POST handling
// ---------------------------------------------------------------------------

describe("Meta webhook POST handling", () => {
  it("stores an inbound message, updates the conversation, and acknowledges with 200", async () => {
    const { admin, tables } = createFakeAdmin({ conversations: [seedConversation()] });
    const response = await handleMetaWebhook(
      admin,
      await metaPostRequest(inboundPayload()),
      APP_SECRET,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, pending: false, duplicate: false });

    const messages = tables[MESSAGES]!;
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      conversation_id: "conv-1",
      user_id: "user-1",
      provider_message_id: "wamid.HBgMOTE5MzUxNjA4NTkwFQIAERgSMDEyMzQ1Njc4OTABCAA=",
      direction: "inbound",
      message_type: "text",
      recipient_phone: "919351608590",
      body: "Is the 2BHK still available?",
      status: "delivered",
      provider_timestamp: new Date(1790282400 * 1000).toISOString(),
    });

    const conversation = tables[CONVERSATIONS]![0]!;
    expect(conversation.last_message).toBe("Is the 2BHK still available?");
    expect(conversation.unread_count).toBe(4); // 3 + 1
    expect(conversation.last_message_at).toBeTruthy();

    const event = tables[WEBHOOK_EVENTS]![0]!;
    expect(event.event).toBe("whatsapp.message");
    expect(event.delivery_id.startsWith("meta:")).toBe(true);
    expect(event.processed_at).toBeTruthy();
    expect(event.processing_error).toBeNull();
  });

  it("is idempotent for Meta redeliveries: no duplicate message, no double unread bump", async () => {
    const { admin, tables } = createFakeAdmin({ conversations: [seedConversation()] });
    const body = inboundPayload();

    const first = await handleMetaWebhook(admin, await metaPostRequest(body), APP_SECRET);
    expect(first.status).toBe(200);
    const second = await handleMetaWebhook(admin, await metaPostRequest(body), APP_SECRET);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ ok: true, pending: false, duplicate: true });

    expect(tables[MESSAGES]).toHaveLength(1);
    expect(tables[WEBHOOK_EVENTS]).toHaveLength(1);
    expect(tables[CONVERSATIONS]![0]!.unread_count).toBe(4);
  });

  it("does not double-insert when the provider message already exists", async () => {
    const existing = seedOutboundMessage({
      direction: "inbound",
      provider_message_id: "wamid.HBgMOTE5MzUxNjA4NTkwFQIAERgSMDEyMzQ1Njc4OTABCAA=",
    });
    const { admin, tables } = createFakeAdmin({
      conversations: [seedConversation()],
      messages: [existing],
    });
    const response = await handleMetaWebhook(
      admin,
      await metaPostRequest(inboundPayload()),
      APP_SECRET,
    );
    expect(response.status).toBe(200);
    expect(tables[MESSAGES]).toHaveLength(1);
    expect(tables[CONVERSATIONS]![0]!.unread_count).toBe(3); // unchanged
  });

  it("rejects an invalid signature with 401 and writes nothing", async () => {
    const { admin, tables } = createFakeAdmin({ conversations: [seedConversation()] });
    const body = inboundPayload();
    const request = new Request("https://app.example/api/public/whatsapp/webhook", {
      method: "POST",
      headers: {
        "X-Hub-Signature-256":
          "sha256=0000000000000000000000000000000000000000000000000000000000000000",
      },
      body,
    });
    const response = await handleMetaWebhook(admin, request, APP_SECRET);
    expect(response.status).toBe(401);
    expect(tables[MESSAGES]).toHaveLength(0);
    expect(tables[WEBHOOK_EVENTS]).toHaveLength(0);
  });

  it("rejects a well-signed but malformed JSON body with 400", async () => {
    const { admin, tables } = createFakeAdmin({ conversations: [seedConversation()] });
    const response = await handleMetaWebhook(admin, await metaPostRequest("{not-json"), APP_SECRET);
    expect(response.status).toBe(400);
    expect(tables[WEBHOOK_EVENTS]).toHaveLength(0);
  });

  it("rejects oversized bodies with 413 before signature work", async () => {
    const { admin } = createFakeAdmin();
    const response = await handleMetaWebhook(
      admin,
      new Request("https://app.example/api/public/whatsapp/webhook", {
        method: "POST",
        body: "x".repeat(4 * 1024 * 1024 + 1),
      }),
      APP_SECRET,
    );
    expect(response.status).toBe(413);
  });

  it("returns 500 when the App Secret is not configured (never falls back to unsigned acceptance)", async () => {
    const { admin, tables } = createFakeAdmin({ conversations: [seedConversation()] });
    const response = await handleMetaWebhook(
      admin,
      await metaPostRequest(inboundPayload()),
      undefined,
    );
    expect(response.status).toBe(500);
    expect(tables[WEBHOOK_EVENTS]).toHaveLength(0);
  });

  it("acknowledges unsupported event payloads with 200 so Meta stops retrying", async () => {
    const { admin, tables } = createFakeAdmin();
    const unsupported = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          id: "1",
          changes: [{ field: "message_template_status_update", value: { event: "APPROVED" } }],
        },
      ],
    });
    const response = await handleMetaWebhook(admin, await metaPostRequest(unsupported), APP_SECRET);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, pending: false, duplicate: false });
    const event = tables[WEBHOOK_EVENTS]![0]!;
    expect(event.event).toBe("whatsapp.event");
    expect(event.processed_at).toBeTruthy();
  });

  it("acknowledges change-less payloads with 200 and stores nothing", async () => {
    const { admin, tables } = createFakeAdmin();
    const empty = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const response = await handleMetaWebhook(admin, await metaPostRequest(empty), APP_SECRET);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, ignored: true });
    expect(tables[WEBHOOK_EVENTS]).toHaveLength(0);
  });

  it("processes a delivery-status callback and advances the outbound message state", async () => {
    const { admin, tables } = createFakeAdmin({
      conversations: [seedConversation()],
      messages: [seedOutboundMessage()],
    });
    const response = await handleMetaWebhook(
      admin,
      await metaPostRequest(statusPayload()),
      APP_SECRET,
    );
    expect(response.status).toBe(200);
    expect(tables[MESSAGES]![0]!.status).toBe("delivered");
    expect(tables[MESSAGES]![0]!.provider_timestamp).toBe(
      new Date(1790282460 * 1000).toISOString(),
    );
    expect(tables[WEBHOOK_EVENTS]![0]!.event).toBe("whatsapp.status");
  });

  it("defers an inbound message for an unknown number instead of guessing conversation ownership", async () => {
    const { admin, tables } = createFakeAdmin(); // no conversations
    const response = await handleMetaWebhook(
      admin,
      await metaPostRequest(inboundPayload()),
      APP_SECRET,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, pending: true, duplicate: false });
    expect(tables[MESSAGES]).toHaveLength(0);
    const event = tables[WEBHOOK_EVENTS]![0]!;
    expect(event.processed_at).toBeNull();
    expect(event.attempt_count).toBe(1);
    expect(event.processing_error).toBeTruthy();
  });

  it("recovers the deferred event on a later delivery once the conversation exists", async () => {
    const { admin, tables } = createFakeAdmin();
    const body = inboundPayload();

    const first = await handleMetaWebhook(admin, await metaPostRequest(body), APP_SECRET);
    expect(await first.json()).toMatchObject({ pending: true });
    expect(tables[MESSAGES]).toHaveLength(0);

    // The outbound flow creates the conversation (user ownership is known there).
    tables[CONVERSATIONS]!.push(seedConversation());

    // Meta redelivers the same webhook after the conversation exists.
    const second = await handleMetaWebhook(admin, await metaPostRequest(body), APP_SECRET);
    expect(await second.json()).toMatchObject({ ok: true, pending: false, duplicate: false });
    expect(tables[MESSAGES]).toHaveLength(1);
    expect(tables[WEBHOOK_EVENTS]![0]!.processed_at).toBeTruthy();
    expect(tables[CONVERSATIONS]![0]!.unread_count).toBe(4);
  });

  it("handles multi-change payloads: message stored AND status updated in one POST", async () => {
    const { admin, tables } = createFakeAdmin({
      conversations: [seedConversation()],
      messages: [seedOutboundMessage()],
    });
    const combined = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          id: "123456789012345",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "919876543210", phone_number_id: "9988776655" },
                messages: [
                  {
                    from: "919351608590",
                    id: "wamid.INBOUND-2",
                    timestamp: "1790282500",
                    type: "text",
                    text: { body: "Please share the brochure" },
                  },
                ],
              },
            },
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "919876543210", phone_number_id: "9988776655" },
                statuses: [
                  {
                    id: "wamid.OUTBOUND-1",
                    status: "read",
                    timestamp: "1790282520",
                    recipient_id: "919351608590",
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const response = await handleMetaWebhook(admin, await metaPostRequest(combined), APP_SECRET);
    expect(response.status).toBe(200);
    expect(tables[WEBHOOK_EVENTS]).toHaveLength(2);
    expect(
      tables[MESSAGES]!.find((row) => row.provider_message_id === "wamid.INBOUND-2"),
    ).toBeTruthy();
    expect(
      tables[MESSAGES]!.find((row) => row.provider_message_id === "wamid.OUTBOUND-1")!.status,
    ).toBe("read");
  });

  it("skips malformed message entries inside an otherwise valid payload", async () => {
    const { admin, tables } = createFakeAdmin({ conversations: [seedConversation()] });
    const broken = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          id: "1",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "919876543210", phone_number_id: "9988776655" },
                messages: [
                  { id: "", from: "" },
                  {
                    from: "919351608590",
                    id: "wamid.OK-1",
                    timestamp: "1790282600",
                    type: "text",
                    text: { body: "Valid one" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const response = await handleMetaWebhook(admin, await metaPostRequest(broken), APP_SECRET);
    expect(response.status).toBe(200);
    expect(tables[MESSAGES]).toHaveLength(1);
    expect(tables[MESSAGES]![0]!.provider_message_id).toBe("wamid.OK-1");
  });
});
