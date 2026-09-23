import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  Clock3,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SectionTabs } from "@/components/SectionTabs";
import { Badge, ButtonAzure, ButtonGhost, Label, Panel, statusTone } from "@/components/ui-kit";
import { DEFAULT_CONTACTS } from "@/lib/call-store";
import { getWhatsAppInbox, getWhatsAppMessages, sendWhatsAppMessage } from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp Inbox — Tutu AI Calling Assistant" },
      {
        name: "description",
        content: "Send WhatsApp messages to existing Tutu customers and track their delivery status.",
      },
      { property: "og:title", content: "WhatsApp Inbox — Tutu AI Calling Assistant" },
      { property: "og:description", content: "Message existing customers from Tutu and follow each delivery status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WhatsAppPage,
});

type WorkspaceContact = {
  id: string;
  name: string;
  phone: string;
  project: string;
  budget?: string;
  status?: string;
  avatarInitials: string;
};

type Conversation = {
  id: string;
  contact_name: string;
  phone_number: string;
  avatar_initials: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

type Message = {
  id: string;
  direction: string;
  body: string | null;
  status: string;
  error_reason: string | null;
  created_at: string;
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function statusToneForMessage(status: string) {
  if (status === "failed") return "bad" as const;
  if (status === "read" || status === "delivered") return "good" as const;
  if (status === "sending") return "warn" as const;
  return "azure" as const;
}

function StatusMark({ status }: { status: string }) {
  if (status === "failed") return <AlertTriangle size={14} aria-hidden="true" />;
  if (status === "sending") return <Clock3 size={14} aria-hidden="true" />;
  if (status === "delivered" || status === "read") return <CheckCheck size={14} aria-hidden="true" />;
  return <Check size={14} aria-hidden="true" />;
}

function WhatsAppPage() {
  const queryClient = useQueryClient();
  const inboxFn = useQuery({ queryKey: ["whatsapp", "inbox"], queryFn: () => getWhatsAppInbox() });
  const sendFn = useMutation({ mutationFn: sendWhatsAppMessage });
  const [selectedPhone, setSelectedPhone] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const conversations = (inboxFn.data?.conversations ?? []) as Conversation[];
  const contacts = useMemo<WorkspaceContact[]>(() => {
    const fromCalls = DEFAULT_CONTACTS.map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      project: contact.project,
      budget: contact.budget,
      status: contact.status,
      avatarInitials: initials(contact.name),
    }));
    const fromConversations = conversations.map((conversation) => ({
      id: conversation.id,
      name: conversation.contact_name,
      phone: `+${conversation.phone_number}`,
      project: "WhatsApp conversation",
      avatarInitials: conversation.avatar_initials || initials(conversation.contact_name),
    }));
    const merged = new Map<string, WorkspaceContact>();
    [...fromCalls, ...fromConversations].forEach((contact) => merged.set(digits(contact.phone), contact));
    return [...merged.values()];
  }, [conversations]);

  const visibleContacts = contacts.filter((contact) => {
    const haystack = `${contact.name} ${contact.phone} ${contact.project}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });
  const selectedContact = contacts.find((contact) => digits(contact.phone) === digits(selectedPhone));
  const selectedConversation = conversations.find(
    (conversation) => digits(conversation.phone_number) === digits(selectedContact?.phone ?? selectedPhone),
  );

  useEffect(() => {
    const phoneFromLead = new URLSearchParams(window.location.search).get("phone");
    if (phoneFromLead) setSelectedPhone(phoneFromLead);
  }, []);

  useEffect(() => {
    if (!selectedPhone && visibleContacts[0]) setSelectedPhone(visibleContacts[0].phone);
  }, [selectedPhone, visibleContacts]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedConversation?.id) {
      setConversationMessages([]);
      return;
    }
    setMessagesLoading(true);
    getWhatsAppMessages({ data: { conversationId: selectedConversation.id } })
      .then((result) => {
        if (!cancelled) setConversationMessages(result.messages as Message[]);
      })
      .catch(() => {
        if (!cancelled) setNotice({ tone: "bad", text: "This conversation could not be loaded." });
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedConversation?.id]);

  const handleRefresh = async () => {
    setNotice(null);
    await queryClient.invalidateQueries({ queryKey: ["whatsapp", "inbox"] });
  };

  const handleSend = async () => {
    if (!selectedContact || !message.trim() || sendFn.isPending) return;
    setNotice(null);
    const result = await sendFn.mutateAsync({
      data: {
        recipientPhone: selectedContact.phone,
        contactName: selectedContact.name,
        message: message.trim(),
        requestId,
      },
    });
    if (!result.ok) {
      setNotice({ tone: "bad", text: result.errorReason });
      return;
    }
    setMessage("");
    setRequestId(crypto.randomUUID());
    setNotice({ tone: "good", text: "Message sent to WhatsApp. Delivery updates will appear here." });
    await queryClient.invalidateQueries({ queryKey: ["whatsapp", "inbox"] });
    setSelectedPhone(selectedContact.phone);
    setConversationMessages((current) => [
      ...current,
      {
        id: result.messageId,
        direction: "outbound",
        body: message.trim(),
        status: result.status,
        error_reason: null,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const queryError = inboxFn.error instanceof Error ? inboxFn.error.message : null;

  return (
    <AppShell>
      <SectionTabs section="communication" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-good" aria-hidden="true" />
            <h1 className="text-xl font-extrabold tracking-tight">WhatsApp</h1>
            <Badge tone="good">Business messaging</Badge>
          </div>
          <p className="mt-1 text-sm text-sub">Choose an existing lead, send a real WhatsApp message, and follow delivery updates.</p>
        </div>
        <ButtonGhost onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw size={15} aria-hidden="true" /> Refresh
        </ButtonGhost>
      </div>

      {queryError ? (
        <Panel className="flex items-start gap-3 border-bad/30 bg-bad/5 p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-bad" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-bad">Sign in to use WhatsApp messaging</div>
            <p className="mt-1 text-xs text-sub">Your customer messages and business connection are protected by your Tutu account.</p>
          </div>
        </Panel>
      ) : null}

      <div className="grid min-h-[620px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-line/70 p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Customers</Label>
                <div className="mt-1 text-sm font-bold">Existing contacts</div>
              </div>
              <span className="font-mono text-[10px] text-sub">{contacts.length}</span>
            </div>
            <label className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-white/80 px-2.5 py-2">
              <Search size={15} className="shrink-0 text-sub" aria-hidden="true" />
              <span className="sr-only">Search customers</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer…"
                className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {visibleContacts.map((contact) => {
              const conversation = conversations.find((item) => digits(item.phone_number) === digits(contact.phone));
              const isSelected = digits(selectedContact?.phone ?? selectedPhone) === digits(contact.phone);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setSelectedPhone(contact.phone);
                    setNotice(null);
                  }}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-3 text-left transition-colors ${
                    isSelected ? "bg-azure/10 ring-1 ring-azure/20" : "hover:bg-canvas"
                  }`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-azure/10 text-xs font-bold text-azure">
                    {contact.avatarInitials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{contact.name}</span>
                      {conversation?.last_message_at ? <span className="font-mono text-[9px] text-sub">{formatTime(conversation.last_message_at)}</span> : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-sub">{conversation?.last_message ?? contact.project}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="flex min-h-0 flex-col overflow-hidden">
          {selectedContact ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-good/10 text-sm font-bold text-good">{initials(selectedContact.name)}</div>
                  <div>
                    <div className="text-sm font-bold">{selectedContact.name}</div>
                    <div className="font-mono text-[11px] text-sub">+{digits(selectedContact.phone)} · {selectedContact.project}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-good">
                  <span className="size-1.5 rounded-full bg-good" /> WhatsApp Business
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-canvas/45 p-4">
                {!selectedConversation ? (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                    <div className="grid size-12 place-items-center rounded-2xl bg-good/10 text-good"><Smartphone size={22} aria-hidden="true" /></div>
                    <div className="mt-3 text-sm font-bold">Start a conversation</div>
                    <p className="mt-1 max-w-xs text-xs leading-relaxed text-sub">Send the first message to {selectedContact.name}. It will appear here with its delivery status.</p>
                  </div>
                ) : messagesLoading ? (
                  <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-sub">Loading messages…</div>
                ) : conversationMessages.length === 0 ? (
                  <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-sub">No messages in this conversation yet.</div>
                ) : (
                  conversationMessages.map((item) => (
                    <div key={item.id} className={`flex ${item.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-xl px-3 py-2 ${item.direction === "outbound" ? "rounded-tr-sm bg-good/10" : "rounded-tl-sm bg-white ring-1 ring-line"}`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</div>
                        <div className={`mt-1 flex items-center justify-end gap-1 font-mono text-[10px] ${item.status === "failed" ? "text-bad" : "text-sub"}`}>
                          {formatTime(item.created_at)}
                          {item.direction === "outbound" ? <StatusMark status={item.status} /> : null}
                          {item.direction === "outbound" ? <span className="capitalize">{item.status}</span> : null}
                        </div>
                        {item.error_reason ? <div className="mt-1 text-[11px] text-bad">{item.error_reason}</div> : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-line/70 bg-white/65 p-3">
                {notice ? (
                  <div className={`mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${notice.tone === "good" ? "bg-good/10 text-good" : "bg-bad/10 text-bad"}`}>
                    {notice.tone === "good" ? <Check size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}
                    <span>{notice.text}</span>
                  </div>
                ) : null}
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={4096}
                  rows={3}
                  placeholder={`Write a message to ${selectedContact.name.split(" ")[0]}…`}
                  className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-sub">
                    <span className={message.length > 3800 ? "text-warn" : ""}>{message.length}/4096</span>
                    <span>·</span>
                    <span>Text message</span>
                  </div>
                  <ButtonAzure
                    onClick={handleSend}
                    className={`flex items-center gap-2 ${sendFn.isPending || !message.trim() ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <Send size={15} aria-hidden="true" /> {sendFn.isPending ? "Sending…" : "Send message"}
                  </ButtonAzure>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-sub">If the customer has not messaged you in the last 24 hours, WhatsApp may require an approved template.</p>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-sub">Select a customer to begin.</div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}