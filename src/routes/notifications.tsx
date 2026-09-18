import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionTabs } from "@/components/SectionTabs";
import { Badge, ButtonAzure, ButtonGhost, Label, Panel, Toggle } from "@/components/ui-kit";
import type { NotificationItem, NotificationType } from "@/types";
import {
  Bell,
  Flame,
  MapPin,
  UserCheck,
  PhoneCall,
  Sparkles,
  Clock,
  AlertTriangle,
  Sliders,
  Mail,
  MessageSquare,
  Smartphone,
  Webhook,
  Volume2,
  Moon,
  Check,
  CheckCheck,
  X,
  Search,
  ArrowRight,
  Inbox,
  ShieldCheck,
  Send,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center & Settings — Tutu Voice Assistant" },
      {
        name: "description",
        content:
          "Live real-time alerts and delivery rules for hot leads, site visits, callbacks, and automated calling triggers.",
      },
    ],
  }),
  component: NotificationsPage,
});

type CategoryFilter = "all" | NotificationType;

interface CategoryConfig {
  id: CategoryFilter;
  label: string;
  icon: LucideIcon;
}

const categories: CategoryConfig[] = [
  { id: "all", label: "All Alerts", icon: Bell },
  { id: "hot_lead", label: "Hot Leads", icon: Flame },
  { id: "site_visit", label: "Site Visits", icon: MapPin },
  { id: "human_handoff", label: "Human Handoff", icon: UserCheck },
  { id: "callback", label: "Callbacks", icon: PhoneCall },
  { id: "high_value", label: "High-Value", icon: Sparkles },
  { id: "followup_due", label: "Follow-ups Due", icon: Clock },
  { id: "failed_call", label: "Failed Retries", icon: AlertTriangle },
];

function getNotificationVisuals(type: NotificationType): {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
} {
  switch (type) {
    case "hot_lead":
      return { icon: Flame, bgColor: "bg-red-500/10", textColor: "text-red-600" };
    case "site_visit":
      return { icon: MapPin, bgColor: "bg-emerald-500/10", textColor: "text-emerald-600" };
    case "human_handoff":
      return { icon: UserCheck, bgColor: "bg-purple-500/10", textColor: "text-purple-600" };
    case "callback":
      return { icon: PhoneCall, bgColor: "bg-blue-500/10", textColor: "text-blue-600" };
    case "high_value":
      return { icon: Sparkles, bgColor: "bg-amber-500/10", textColor: "text-amber-600" };
    case "followup_due":
      return { icon: Clock, bgColor: "bg-indigo-500/10", textColor: "text-indigo-600" };
    case "failed_call":
      return { icon: AlertTriangle, bgColor: "bg-rose-500/10", textColor: "text-rose-600" };
  }
}

function priorityTone(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return "bad";
    case "medium":
      return "warn";
    case "low":
    default:
      return "neutral";
  }
}

export function NotificationsPage() {
  const [activeView, setActiveView] = useState<"alerts" | "settings">("alerts");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [testSentChannel, setTestSentChannel] = useState<string | null>(null);

  // Notification Settings State
  const [inAppSound, setInAppSound] = useState(true);
  const [inAppPopups, setInAppPopups] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [emailAddress, setEmailAddress] = useState("sales-ops@haldengroup.com");
  const [emailDigest, setEmailDigest] = useState("instant");
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("+91 98450 22110");
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [smsNumber, setSmsNumber] = useState("+91 98450 22110");
  const [slackWebhook, setSlackWebhook] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.slack.com/services/T00/B00/halden-leads");

  // Trigger Rules State
  const [triggerHotLead, setTriggerHotLead] = useState(true);
  const [triggerSiteVisit, setTriggerSiteVisit] = useState(true);
  const [triggerHandoff, setTriggerHandoff] = useState(true);
  const [triggerCallback, setTriggerCallback] = useState(true);
  const [triggerHighValue, setTriggerHighValue] = useState(true);
  const [triggerFailedCall, setTriggerFailedCall] = useState(false);

  // Quiet Hours State
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState("21:30");
  const [quietEnd, setQuietEnd] = useState("08:30");
  const [bypassForHotLeads, setBypassForHotLeads] = useState(true);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      const matchCategory = activeCategory === "all" || n.type === activeCategory;
      const matchUnread = !filterUnreadOnly || !n.read;
      const matchSearch =
        !searchQuery.trim() ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchUnread && matchSearch;
    });
  }, [items, activeCategory, filterUnreadOnly, searchQuery]);

  const markAsRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllRead = () => {
    setItems((prev) => prev.filter((n) => !n.read));
  };

  const handleSaveSettings = () => {
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  const handleSendTest = (channel: string) => {
    setTestSentChannel(channel);
    setTimeout(() => setTestSentChannel(null), 2500);
  };

  return (
    <AppShell
      actions={
        <div className="flex items-center gap-2">
          {settingsSavedToast ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-good/10 px-3 py-1.5 font-mono text-xs font-semibold text-good ring-1 ring-good/20">
              <Check className="size-3.5" />
              Settings saved
            </span>
          ) : null}
          {activeView === "alerts" ? (
            <>
              {unreadCount > 0 ? (
                <ButtonAzure onClick={markAllAsRead} className="text-xs flex items-center gap-1.5">
                  <CheckCheck size={14} />
                  <span>Mark all read ({unreadCount})</span>
                </ButtonAzure>
              ) : null}
              <ButtonGhost onClick={clearAllRead} className="text-xs">
                Clear read
              </ButtonGhost>
            </>
          ) : (
            <ButtonAzure onClick={handleSaveSettings} className="text-xs flex items-center gap-1.5">
              <Check size={14} />
              <span>Save notification settings</span>
            </ButtonAzure>
          )}
        </div>
      }
    >
      <SectionTabs section="communication" />

      {/* Top View Selector: Alerts Feed vs Notification Settings */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-canvas/80 p-1 ring-1 ring-line/60">
          <button
            type="button"
            onClick={() => setActiveView("alerts")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeView === "alerts"
                ? "bg-white text-ink shadow-sm ring-1 ring-black/5"
                : "text-sub hover:text-ink hover:bg-white/50"
            }`}
          >
            <Bell size={15} className={activeView === "alerts" ? "text-azure" : "text-sub"} />
            <span>Alerts Feed</span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-azure px-1.5 py-0.2 font-mono text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveView("settings")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeView === "settings"
                ? "bg-white text-ink shadow-sm ring-1 ring-black/5"
                : "text-sub hover:text-ink hover:bg-white/50"
            }`}
          >
            <Sliders size={15} className={activeView === "settings" ? "text-azure" : "text-sub"} />
            <span>Notification Settings & Rules</span>
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-sub">
          <span className="size-2 rounded-full bg-good animate-pulse" />
          <span>Real-time Trigger Engine: Active</span>
        </div>
      </div>

      {activeView === "alerts" ? (
        /* ================= ALERTS FEED VIEW ================= */
        <div className="space-y-4">
          {/* Category Tabs */}
          <Panel className="p-1.5" delay={0}>
            <div className="flex overflow-x-auto gap-1 no-scrollbar">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const count =
                  cat.id === "all"
                    ? items.length
                    : items.filter((n) => n.type === cat.id).length;
                const active = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "bg-azure text-white shadow-sm font-semibold"
                        : "text-sub hover:bg-black/5 hover:text-ink"
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span>{cat.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                        active ? "bg-white/20 text-white" : "bg-ink/5 text-sub"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="relative min-w-[240px] max-w-sm flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
              <input
                type="text"
                placeholder="Search alerts, leads, or keywords…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-line bg-white/80 py-1.5 pl-9 pr-3 text-xs outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
              />
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-sub hover:text-ink">
                <input
                  type="checkbox"
                  checked={filterUnreadOnly}
                  onChange={(e) => setFilterUnreadOnly(e.target.checked)}
                  className="rounded border-line text-azure focus:ring-azure/20"
                />
                <span>Unread only</span>
              </label>

              <span className="font-mono text-[11px] text-sub">
                Showing {filtered.length} of {items.length} alert{items.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2.5">
            {filtered.map((item, index) => {
              const { icon: VisualIcon, bgColor, textColor } = getNotificationVisuals(item.type);

              return (
                <Panel
                  key={item.id}
                  delay={index * 25}
                  className={`p-4 transition-all ${
                    !item.read
                      ? "border-azure/40 bg-white/95 shadow-sm ring-1 ring-azure/10"
                      : "border-line/60 bg-white/60 opacity-90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`grid size-10 shrink-0 place-items-center rounded-xl ${bgColor} ${textColor} ring-1 ring-black/5`}
                      >
                        <VisualIcon size={20} strokeWidth={2} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm font-bold tracking-tight ${
                              !item.read ? "text-ink" : "text-sub"
                            }`}
                          >
                            {item.title}
                          </h3>
                          <Badge tone={priorityTone(item.priority)}>{item.priority} priority</Badge>
                          {!item.read ? (
                            <span className="inline-block size-2 rounded-full bg-azure animate-pulse" />
                          ) : null}
                        </div>

                        <p className="mt-1 text-xs text-ink/80 leading-relaxed max-w-3xl">
                          {item.message}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs">
                          <span className="font-mono text-[11px] text-sub flex items-center gap-1.5">
                            <Clock size={12} className="text-sub/70" />
                            {item.time}
                          </span>
                          {item.linkTo ? (
                            <Link
                              to={item.linkTo as any}
                              className="font-semibold text-azure hover:underline flex items-center gap-1"
                            >
                              <span>Open details</span>
                              <ArrowRight size={13} />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!item.read ? (
                        <button
                          onClick={() => markAsRead(item.id)}
                          className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium text-sub hover:bg-canvas hover:text-ink transition-colors"
                          title="Mark as read"
                        >
                          <Check size={13} />
                          <span>Mark read</span>
                        </button>
                      ) : null}
                      <button
                        onClick={() => deleteNotification(item.id)}
                        className="rounded-lg p-1.5 text-sub hover:bg-bad/10 hover:text-bad transition-colors"
                        title="Dismiss notification"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </Panel>
              );
            })}

            {filtered.length === 0 ? (
              <Panel className="p-16 text-center text-sm text-sub">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-azure/10 text-azure">
                  <Inbox size={24} />
                </div>
                <div className="font-bold text-ink text-base">All Caught Up</div>
                <p className="text-xs text-sub mt-1 max-w-sm mx-auto">
                  No notifications matching your filter criteria. New automated alerts will appear here as callers interact with your agent.
                </p>
              </Panel>
            ) : null}
          </div>
        </div>
      ) : (
        /* ================= NOTIFICATION SETTINGS VIEW ================= */
        <div className="space-y-5">
          {/* Channels Grid */}
          <section className="grid gap-5 lg:grid-cols-2">
            {/* Delivery Channels */}
            <Panel className="p-5 space-y-4" delay={0}>
              <div className="border-b border-line/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-azure/10 text-azure">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">Delivery Channels</h2>
                    <p className="font-mono text-[11px] text-sub">Configure how and where your team receives alerts</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* In-App Alerts */}
                <div className="rounded-xl border border-line/70 bg-canvas/40 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Volume2 size={16} className="text-azure" />
                      <div>
                        <div className="text-xs font-bold text-ink">In-App Banner & Audio Chime</div>
                        <div className="text-[11px] text-sub">Instant visual alert and audio tone on hot leads</div>
                      </div>
                    </div>
                    <Toggle on={inAppSound} onChange={setInAppSound} />
                  </div>
                  <div className="flex items-center justify-between border-t border-line/50 pt-2 text-xs">
                    <span className="text-sub">Desktop browser popups</span>
                    <Toggle on={inAppPopups} onChange={setInAppPopups} />
                  </div>
                </div>

                {/* Email Alerts */}
                <div className="rounded-xl border border-line/70 bg-canvas/40 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Mail size={16} className="text-azure" />
                      <div>
                        <div className="text-xs font-bold text-ink">Email Notifications</div>
                        <div className="text-[11px] text-sub">Dispatch call summaries and transcripts</div>
                      </div>
                    </div>
                    <Toggle on={emailAlerts} onChange={setEmailAlerts} />
                  </div>

                  {emailAlerts ? (
                    <div className="grid gap-2 sm:grid-cols-2 pt-1 border-t border-line/50">
                      <div>
                        <Label>Alert Email Address</Label>
                        <input
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none focus:border-azure/50"
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <select
                          value={emailDigest}
                          onChange={(e) => setEmailDigest(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none focus:border-azure/50"
                        >
                          <option value="instant">Instant on Trigger</option>
                          <option value="hourly">Hourly Digest</option>
                          <option value="daily">Daily 8:00 AM Summary</option>
                        </select>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* WhatsApp Alerts */}
                <div className="rounded-xl border border-line/70 bg-canvas/40 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <MessageSquare size={16} className="text-good" />
                      <div>
                        <div className="text-xs font-bold text-ink">WhatsApp Business Escalation</div>
                        <div className="text-[11px] text-sub">Instant ping to on-duty sales rep phone</div>
                      </div>
                    </div>
                    <Toggle on={whatsappAlerts} onChange={setWhatsappAlerts} />
                  </div>

                  {whatsappAlerts ? (
                    <div className="flex items-center gap-2 pt-1 border-t border-line/50">
                      <div className="flex-1">
                        <Label>Sales Rep WhatsApp Number</Label>
                        <input
                          type="tel"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-line bg-white px-2.5 py-1.5 font-mono text-xs outline-none focus:border-azure/50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendTest("WhatsApp")}
                        className="mt-4 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-sub hover:text-ink transition-colors flex items-center gap-1"
                      >
                        <Send size={12} />
                        <span>{testSentChannel === "WhatsApp" ? "Sent!" : "Test"}</span>
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Webhook / Slack */}
                <div className="rounded-xl border border-line/70 bg-canvas/40 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Webhook size={16} className="text-purple-600" />
                      <div>
                        <div className="text-xs font-bold text-ink">Slack / Custom Webhook</div>
                        <div className="text-[11px] text-sub">POST payload JSON on high-priority call events</div>
                      </div>
                    </div>
                    <Toggle on={slackWebhook} onChange={setSlackWebhook} />
                  </div>

                  {slackWebhook ? (
                    <div className="flex items-center gap-2 pt-1 border-t border-line/50">
                      <div className="flex-1">
                        <Label>Incoming Webhook URL</Label>
                        <input
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-line bg-white px-2.5 py-1.5 font-mono text-xs outline-none focus:border-azure/50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendTest("Webhook")}
                        className="mt-4 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-sub hover:text-ink transition-colors flex items-center gap-1"
                      >
                        <Send size={12} />
                        <span>{testSentChannel === "Webhook" ? "Pinged!" : "Ping"}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </Panel>

            {/* Event Trigger Rules */}
            <Panel className="p-5 space-y-4" delay={60}>
              <div className="border-b border-line/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-good/10 text-good">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">Event Automation Rules</h2>
                    <p className="font-mono text-[11px] text-sub">Select which AI conversational milestones fire alerts</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <Flame size={16} className="text-red-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">Hot Lead Qualified</div>
                      <div className="text-[11px] text-sub">Buyer exhibits high budget, timeline &lt; 30d</div>
                    </div>
                  </div>
                  <Toggle on={triggerHotLead} onChange={setTriggerHotLead} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">Site Visit Confirmed</div>
                      <div className="text-[11px] text-sub">Agent locks appointment date and time</div>
                    </div>
                  </div>
                  <Toggle on={triggerSiteVisit} onChange={setTriggerSiteVisit} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <UserCheck size={16} className="text-purple-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">Human Handoff Requested</div>
                      <div className="text-[11px] text-sub">Buyer requests live sales agent transfer</div>
                    </div>
                  </div>
                  <Toggle on={triggerHandoff} onChange={setTriggerHandoff} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-indigo-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">Scheduled Follow-up Due</div>
                      <div className="text-[11px] text-sub">15-minute advance reminder before touchpoint</div>
                    </div>
                  </div>
                  <Toggle on={triggerCallback} onChange={setTriggerCallback} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-amber-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">High-Value Prospect (₹2 Cr+)</div>
                      <div className="text-[11px] text-sub">Luxury portfolio inquiries notify Sales VP</div>
                    </div>
                  </div>
                  <Toggle on={triggerHighValue} onChange={setTriggerHighValue} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={16} className="text-rose-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">Call Retries Exceeded</div>
                      <div className="text-[11px] text-sub">Flag for manual review after 3 failed attempts</div>
                    </div>
                  </div>
                  <Toggle on={triggerFailedCall} onChange={setTriggerFailedCall} />
                </div>
              </div>
            </Panel>
          </section>

          {/* Quiet Hours & Escalation Window */}
          <Panel className="p-5 space-y-4" delay={90}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Moon size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight">Quiet Hours & Do-Not-Disturb</h2>
                  <p className="font-mono text-[11px] text-sub">Mute non-critical audible alerts during night hours</p>
                </div>
              </div>
              <Toggle on={quietHoursEnabled} onChange={setQuietHoursEnabled} />
            </div>

            {quietHoursEnabled ? (
              <div className="grid gap-4 sm:grid-cols-3 pt-1">
                <div>
                  <Label>Mute Alerts Starting At</Label>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-azure/50"
                  />
                </div>
                <div>
                  <Label>Resume Normal Alerts At</Label>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-azure/50"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink font-medium pb-2">
                    <input
                      type="checkbox"
                      checked={bypassForHotLeads}
                      onChange={(e) => setBypassForHotLeads(e.target.checked)}
                      className="rounded border-line text-azure focus:ring-azure/20"
                    />
                    <span>Allow Hot Leads to bypass DND</span>
                  </label>
                </div>
              </div>
            ) : null}
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
