import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Badge,
  ButtonAzure,
  ButtonDark,
  ButtonGhost,
  Field,
  Label,
  Modal,
  Panel,
  SelectField,
  Toggle,
} from "@/components/ui-kit";
import {
  Building2,
  Bell,
  Phone,
  Clock3,
  Zap,
  Users,
  CreditCard,
  Volume2,
  Mail,
  MessageSquare,
  Webhook,
  ShieldCheck,
  Moon,
  Send,
  Check,
  Flame,
  MapPin,
  UserCheck,
  Sparkles,
  AlertTriangle,
  Clock,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Tutu AI Calling Assistant" },
      {
        name: "description",
        content:
          "Configure organization profile, telephony numbers, calling rules, CRM integrations, team roles, and billing.",
      },
    ],
  }),
  component: SettingsPage,
});

type Tab = "general" | "notifications" | "telephony" | "rules" | "integrations" | "team" | "billing";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Sales Manager" | "Lead Specialist" | "Viewer";
  status: "Active" | "Invited";
  initials: string;
}

const initialTeam: TeamMember[] = [
  { id: "tm-1", name: "Anika Rao", email: "anika.rao@haldengroup.com", role: "Admin", status: "Active", initials: "AR" },
  { id: "tm-2", name: "Rohan Mehta", email: "rohan.m@haldengroup.com", role: "Sales Manager", status: "Active", initials: "RM" },
  { id: "tm-3", name: "Priya Sundaram", email: "priya.s@haldengroup.com", role: "Lead Specialist", status: "Active", initials: "PS" },
  { id: "tm-4", name: "Kavita Desai", email: "kavita.d@haldengroup.com", role: "Viewer", status: "Active", initials: "KD" },
];

interface CallerID {
  id: string;
  number: string;
  region: string;
  provider: "Twilio" | "Exotel" | "Plivo";
  status: "Active" | "Standby";
  callsToday: number;
}

const initialNumbers: CallerID[] = [
  { id: "num-1", number: "+91 80 6922 4100", region: "Bengaluru (Primary)", provider: "Twilio", status: "Active", callsToday: 84 },
  { id: "num-2", number: "+91 22 6833 9050", region: "Mumbai (West)", provider: "Exotel", status: "Active", callsToday: 36 },
  { id: "num-3", number: "+91 44 6120 7700", region: "Chennai (South Hub)", provider: "Plivo", status: "Standby", callsToday: 12 },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [savedToast, setSavedToast] = useState(false);

  // General Settings State
  const [companyName, setCompanyName] = useState("Halden Developers Ltd.");
  const [contactEmail, setContactEmail] = useState("contact@haldengroup.com");
  const [contactPhone, setContactPhone] = useState("+91 80 4910 2200");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST · UTC+05:30)");
  const [currency, setCurrency] = useState("INR (₹)");
  const [autoSummary, setAutoSummary] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  // Telephony State
  const [recordCalls, setRecordCalls] = useState(true);
  const [announcement, setAnnouncement] = useState(true);
  const [callerIds, setCallerIds] = useState<CallerID[]>(initialNumbers);
  const [showAddNumber, setShowAddNumber] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newProvider, setNewProvider] = useState<"Twilio" | "Exotel" | "Plivo">("Twilio");

  // Calling Rules State
  const [callingStart, setCallingStart] = useState("09:30");
  const [callingEnd, setCallingEnd] = useState("19:30");
  const [allowSaturday, setAllowSaturday] = useState(true);
  const [allowSunday, setAllowSunday] = useState(false);
  const [maxRetries, setMaxRetries] = useState("3 attempts");
  const [retryDelay, setRetryDelay] = useState("4 hours");
  const [dndScrubbing, setDndScrubbing] = useState(true);
  const [autoDndOnKeyword, setAutoDndOnKeyword] = useState(true);

  // Integrations State
  const [salesforceConnected, setSalesforceConnected] = useState(true);
  const [hubspotConnected, setHubspotConnected] = useState(true);
  const [leadSquaredConnected, setLeadSquaredConnected] = useState(true);
  const [zohoConnected, setZohoConnected] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://api.haldengroup.com/webhooks/calls/v1");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeam);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("Lead Specialist");

  // Billing State
  const [autoRecharge, setAutoRecharge] = useState(true);

  // Notification Settings State
  const [notifInAppSound, setNotifInAppSound] = useState(true);
  const [notifInAppPopups, setNotifInAppPopups] = useState(true);
  const [notifEmailAlerts, setNotifEmailAlerts] = useState(true);
  const [notifEmailAddress, setNotifEmailAddress] = useState("sales-ops@haldengroup.com");
  const [notifEmailDigest, setNotifEmailDigest] = useState("instant");
  const [notifWhatsappAlerts, setNotifWhatsappAlerts] = useState(true);
  const [notifWhatsappNumber, setNotifWhatsappNumber] = useState("+91 98450 22110");
  const [notifSlackWebhook, setNotifSlackWebhook] = useState(true);
  const [notifWebhookUrl, setNotifWebhookUrl] = useState("https://hooks.slack.com/services/T00/B00/halden-leads");
  const [notifTriggerHotLead, setNotifTriggerHotLead] = useState(true);
  const [notifTriggerSiteVisit, setNotifTriggerSiteVisit] = useState(true);
  const [notifTriggerHandoff, setNotifTriggerHandoff] = useState(true);
  const [notifTriggerCallback, setNotifTriggerCallback] = useState(true);
  const [notifTriggerHighValue, setNotifTriggerHighValue] = useState(true);
  const [notifTriggerFailedCall, setNotifTriggerFailedCall] = useState(false);
  const [notifQuietHours, setNotifQuietHours] = useState(true);
  const [notifQuietStart, setNotifQuietStart] = useState("21:30");
  const [notifQuietEnd, setNotifQuietEnd] = useState("08:30");
  const [notifBypassHotLeads, setNotifBypassHotLeads] = useState(true);
  const [testSentChannel, setTestSentChannel] = useState<string | null>(null);

  const handleSendTest = (channel: string) => {
    setTestSentChannel(channel);
    setTimeout(() => setTestSentChannel(null), 2500);
  };

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleAddNumber = () => {
    if (!newNumber.trim()) return;
    const added: CallerID = {
      id: `num-${Date.now()}`,
      number: newNumber.trim(),
      region: newRegion.trim() || "National",
      provider: newProvider,
      status: "Active",
      callsToday: 0,
    };
    setCallerIds([...callerIds, added]);
    setNewNumber("");
    setNewRegion("");
    setShowAddNumber(false);
    handleSave();
  };

  const handleInviteMember = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const initials = inviteName
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const newMem: TeamMember = {
      id: `tm-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "Invited",
      initials: initials || "TM",
    };
    setTeamMembers([...teamMembers, newMem]);
    setInviteName("");
    setInviteEmail("");
    setShowInviteModal(false);
    handleSave();
  };

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "general", label: "General & Profile", icon: Building2 },
    { id: "notifications", label: "Notifications & Alerts", icon: Bell },
    { id: "telephony", label: "Telephony & Caller IDs", icon: Phone },
    { id: "rules", label: "Calling Rules & DND", icon: Clock3 },
    { id: "integrations", label: "Integrations & APIs", icon: Zap },
    { id: "team", label: "Team & Roles", icon: Users },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
  ];

  return (
    <AppShell
      actions={
        <div className="flex items-center gap-2">
          {savedToast ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-good/10 px-3 py-1.5 font-mono text-xs font-semibold text-good ring-1 ring-good/20">
              <span className="size-1.5 rounded-full bg-good animate-pulse" />
              Settings saved
            </span>
          ) : null}
          <ButtonAzure onClick={handleSave}>Save changes</ButtonAzure>
        </div>
      }
    >
      {/* Settings Navigation Tabs */}
      <Panel className="p-1.5">
        <div className="flex overflow-x-auto gap-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-azure text-white shadow-sm"
                    : "text-sub hover:bg-black/5 hover:text-ink"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* TAB 1: GENERAL & PROFILE */}
      {activeTab === "general" && (
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-3">
            <Panel className="p-5 lg:col-span-2 space-y-4" delay={0}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-base font-bold tracking-tight">Organization Profile</h2>
                <p className="font-mono text-xs text-sub mt-0.5">
                  General details and branding used across AI call summaries and reports
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Company Name</Label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
                  />
                </div>
                <div>
                  <Label>Workspace Domain</Label>
                  <input
                    type="text"
                    readOnly
                    value="halden.assistant.ai"
                    className="mt-1.5 w-full rounded-lg border border-line bg-canvas/60 px-3 py-2 font-mono text-sm text-sub cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Primary Contact Email</Label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
                  />
                </div>
                <div>
                  <Label>Support Phone Line</Label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Default Timezone"
                  options={[
                    "Asia/Kolkata (IST · UTC+05:30)",
                    "Asia/Dubai (GST · UTC+04:00)",
                    "Europe/London (GMT · UTC+00:00)",
                    "America/New_York (EST · UTC-05:00)",
                  ]}
                  value={timezone}
                />
                <SelectField
                  label="Display Currency"
                  options={["INR (₹) - Indian Rupee", "USD ($) - US Dollar", "AED (د.إ) - UAE Dirham"]}
                  value={currency}
                />
              </div>
            </Panel>

            <Panel className="p-5 space-y-4" delay={60}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-sm font-bold tracking-tight">AI Assistant Defaults</h2>
                <p className="font-mono text-[10px] text-sub mt-0.5">Automation and notifications</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3">
                  <div>
                    <div className="text-sm font-semibold">Auto-summarize calls</div>
                    <div className="text-xs text-sub">Generate key points & intent score</div>
                  </div>
                  <Toggle on={autoSummary} onChange={setAutoSummary} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3">
                  <div>
                    <div className="text-sm font-semibold">Daily email digest</div>
                    <div className="text-xs text-sub">Send KPI summary at 8:00 AM</div>
                  </div>
                  <Toggle on={dailyDigest} onChange={setDailyDigest} />
                </div>

                <div className="rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <Label>Primary Calling Model</Label>
                  <div className="mt-1 text-sm font-semibold">Halden Voice Core v2.4 (Fine-tuned)</div>
                  <div className="mt-0.5 font-mono text-[10px] text-good">Latency: ~340ms · 99.8% uptime</div>
                </div>
              </div>
            </Panel>
          </section>
        </div>
      )}

      {/* TAB: NOTIFICATIONS & ALERTS */}
      {activeTab === "notifications" && (
        <div className="space-y-5">
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
                    <Toggle on={notifInAppSound} onChange={setNotifInAppSound} />
                  </div>
                  <div className="flex items-center justify-between border-t border-line/50 pt-2 text-xs">
                    <span className="text-sub">Desktop browser popups</span>
                    <Toggle on={notifInAppPopups} onChange={setNotifInAppPopups} />
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
                    <Toggle on={notifEmailAlerts} onChange={setNotifEmailAlerts} />
                  </div>

                  {notifEmailAlerts ? (
                    <div className="grid gap-2 sm:grid-cols-2 pt-1 border-t border-line/50">
                      <div>
                        <Label>Alert Email Address</Label>
                        <input
                          type="email"
                          value={notifEmailAddress}
                          onChange={(e) => setNotifEmailAddress(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs outline-none focus:border-azure/50"
                        />
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <select
                          value={notifEmailDigest}
                          onChange={(e) => setNotifEmailDigest(e.target.value)}
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
                    <Toggle on={notifWhatsappAlerts} onChange={setNotifWhatsappAlerts} />
                  </div>

                  {notifWhatsappAlerts ? (
                    <div className="flex items-center gap-2 pt-1 border-t border-line/50">
                      <div className="flex-1">
                        <Label>Sales Rep WhatsApp Number</Label>
                        <input
                          type="tel"
                          value={notifWhatsappNumber}
                          onChange={(e) => setNotifWhatsappNumber(e.target.value)}
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
                    <Toggle on={notifSlackWebhook} onChange={setNotifSlackWebhook} />
                  </div>

                  {notifSlackWebhook ? (
                    <div className="flex items-center gap-2 pt-1 border-t border-line/50">
                      <div className="flex-1">
                        <Label>Incoming Webhook URL</Label>
                        <input
                          type="url"
                          value={notifWebhookUrl}
                          onChange={(e) => setNotifWebhookUrl(e.target.value)}
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
                  <Toggle on={notifTriggerHotLead} onChange={setNotifTriggerHotLead} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">Site Visit Confirmed</div>
                      <div className="text-[11px] text-sub">Agent locks appointment date and time</div>
                    </div>
                  </div>
                  <Toggle on={notifTriggerSiteVisit} onChange={setNotifTriggerSiteVisit} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <UserCheck size={16} className="text-purple-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">Human Handoff Requested</div>
                      <div className="text-[11px] text-sub">Buyer requests live sales agent transfer</div>
                    </div>
                  </div>
                  <Toggle on={notifTriggerHandoff} onChange={setNotifTriggerHandoff} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-indigo-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">Scheduled Follow-up Due</div>
                      <div className="text-[11px] text-sub">15-minute advance reminder before touchpoint</div>
                    </div>
                  </div>
                  <Toggle on={notifTriggerCallback} onChange={setNotifTriggerCallback} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-amber-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">High-Value Prospect (₹2 Cr+)</div>
                      <div className="text-[11px] text-sub">Luxury portfolio inquiries notify Sales VP</div>
                    </div>
                  </div>
                  <Toggle on={notifTriggerHighValue} onChange={setNotifTriggerHighValue} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={16} className="text-rose-600" />
                    <div>
                      <div className="text-xs font-bold text-ink">Call Retries Exceeded</div>
                      <div className="text-[11px] text-sub">Flag for manual review after 3 failed attempts</div>
                    </div>
                  </div>
                  <Toggle on={notifTriggerFailedCall} onChange={setNotifTriggerFailedCall} />
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
              <Toggle on={notifQuietHours} onChange={setNotifQuietHours} />
            </div>

            {notifQuietHours ? (
              <div className="grid gap-4 sm:grid-cols-3 pt-1">
                <div>
                  <Label>Mute Alerts Starting At</Label>
                  <input
                    type="time"
                    value={notifQuietStart}
                    onChange={(e) => setNotifQuietStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-azure/50"
                  />
                </div>
                <div>
                  <Label>Resume Normal Alerts At</Label>
                  <input
                    type="time"
                    value={notifQuietEnd}
                    onChange={(e) => setNotifQuietEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-azure/50"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink font-medium pb-2">
                    <input
                      type="checkbox"
                      checked={notifBypassHotLeads}
                      onChange={(e) => setNotifBypassHotLeads(e.target.checked)}
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

      {/* TAB 3: TELEPHONY & CALLER IDS */}
      {activeTab === "telephony" && (
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-3">
            <Panel className="p-5 lg:col-span-2 space-y-4" delay={0}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 pb-3">
                <div>
                  <h2 className="text-base font-bold tracking-tight">Active Outbound Numbers</h2>
                  <p className="font-mono text-xs text-sub mt-0.5">
                    Phone numbers used to initiate outbound real estate discovery calls
                  </p>
                </div>
                <ButtonAzure onClick={() => setShowAddNumber(true)}>+ Add Number</ButtonAzure>
              </div>

              <div className="divide-y divide-line/70">
                {callerIds.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-azure/10 font-mono text-sm font-bold text-azure">
                        {item.provider[0]}
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold">{item.number}</div>
                        <div className="text-xs text-sub">
                          {item.region} · Provider: <span className="font-semibold">{item.provider}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-xs text-sub">
                        <span className="font-bold text-ink">{item.callsToday}</span> calls today
                      </div>
                      <Badge tone={item.status === "Active" ? "good" : "neutral"}>{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-5 space-y-4" delay={60}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-sm font-bold tracking-tight">Recording & Audio</h2>
                <p className="font-mono text-[10px] text-sub mt-0.5">Audio stream preferences</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3">
                  <div>
                    <div className="text-sm font-semibold">Record All Calls</div>
                    <div className="text-xs text-sub">Save MP3 & transcript for training</div>
                  </div>
                  <Toggle on={recordCalls} onChange={setRecordCalls} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3">
                  <div>
                    <div className="text-sm font-semibold">Consent Announcement</div>
                    <div className="text-xs text-sub">Announce recording before talk starts</div>
                  </div>
                  <Toggle on={announcement} onChange={setAnnouncement} />
                </div>

                <div className="rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <Label>SIP Trunk Gateway</Label>
                  <div className="mt-1 font-mono text-xs font-semibold text-ink">
                    sip:halden-calling.pstn.twilio.com
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-sub">TLS 1.3 · SRTP encrypted</div>
                </div>
              </div>
            </Panel>
          </section>
        </div>
      )}

      {/* TAB 3: CALLING RULES & DND */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-3">
            <Panel className="p-5 lg:col-span-2 space-y-4" delay={0}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-base font-bold tracking-tight">Calling Hours & Operational Window</h2>
                <p className="font-mono text-xs text-sub mt-0.5">
                  Aria will only dial prospective customers within these regulated operational hours
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Window Start Time (IST)</Label>
                  <input
                    type="time"
                    value={callingStart}
                    onChange={(e) => setCallingStart(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
                  />
                </div>
                <div>
                  <Label>Window End Time (IST)</Label>
                  <input
                    type="time"
                    value={callingEnd}
                    onChange={(e) => setCallingEnd(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
                  />
                </div>
              </div>

              <div className="border-t border-line/70 pt-4">
                <Label>Allowed Calling Days</Label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3">
                    <span className="text-sm font-semibold">Monday – Friday</span>
                    <Badge tone="good">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3">
                    <span className="text-sm font-semibold">Saturday Campaigns</span>
                    <Toggle on={allowSaturday} onChange={setAllowSaturday} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3 sm:col-span-2">
                    <div>
                      <span className="text-sm font-semibold">Sunday Calls (Restricted)</span>
                      <p className="text-xs text-sub">Disabled by default per Indian tele-marketing compliance</p>
                    </div>
                    <Toggle on={allowSunday} onChange={setAllowSunday} />
                  </div>
                </div>
              </div>

              <div className="border-t border-line/70 pt-4 grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Max Follow-up Retries"
                  options={["1 attempt", "2 attempts", "3 attempts", "5 attempts"]}
                  value={maxRetries}
                />
                <SelectField
                  label="Minimum Delay Between Retries"
                  options={["2 hours", "4 hours", "8 hours", "24 hours", "48 hours"]}
                  value={retryDelay}
                />
              </div>
            </Panel>

            <Panel className="p-5 space-y-4" delay={60}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-sm font-bold tracking-tight">Compliance & DND</h2>
                <p className="font-mono text-[10px] text-sub mt-0.5">Regulatory filters</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3">
                  <div>
                    <div className="text-sm font-semibold">TRAI DND Scrubbing</div>
                    <div className="text-xs text-sub">Pre-check national registry</div>
                  </div>
                  <Toggle on={dndScrubbing} onChange={setDndScrubbing} />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3">
                  <div>
                    <div className="text-sm font-semibold">Auto-Opt Out Detection</div>
                    <div className="text-xs text-sub">If user asks not to call again</div>
                  </div>
                  <Toggle on={autoDndOnKeyword} onChange={setAutoDndOnKeyword} />
                </div>

                <div className="rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Internal DND Blocklist</span>
                    <span className="font-mono text-xs font-bold text-ink">48 numbers</span>
                  </div>
                  <p className="mt-1 text-xs text-sub">Numbers explicitly marked as Not Interested or Do Not Call.</p>
                </div>
              </div>
            </Panel>
          </section>
        </div>
      )}

      {/* TAB 4: INTEGRATIONS & APIS */}
      {activeTab === "integrations" && (
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-3">
            <Panel className="p-5 lg:col-span-2 space-y-4" delay={0}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-base font-bold tracking-tight">CRM & Lead Sync Connectors</h2>
                <p className="font-mono text-xs text-sub mt-0.5">
                  Automatically sync qualified buyer leads and transcripts into your real estate CRM
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-azure/10 text-lg">☁️</div>
                    <div>
                      <div className="text-sm font-bold">Salesforce Real Estate Cloud</div>
                      <div className="text-xs text-sub">Syncing leads, opportunities & recordings</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={salesforceConnected ? "good" : "neutral"}>
                      {salesforceConnected ? "Connected" : "Disconnected"}
                    </Badge>
                    <Toggle on={salesforceConnected} onChange={setSalesforceConnected} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-warn/10 text-lg">🟧</div>
                    <div>
                      <div className="text-sm font-bold">HubSpot CRM</div>
                      <div className="text-xs text-sub">Two-way deal stages and contact syncing</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={hubspotConnected ? "good" : "neutral"}>
                      {hubspotConnected ? "Connected" : "Disconnected"}
                    </Badge>
                    <Toggle on={hubspotConnected} onChange={setHubspotConnected} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-good/10 text-lg">⚡</div>
                    <div>
                      <div className="text-sm font-bold">LeadSquared Property CRM</div>
                      <div className="text-xs text-sub">Instant push for high-intent site visit requests</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={leadSquaredConnected ? "good" : "neutral"}>
                      {leadSquaredConnected ? "Connected" : "Disconnected"}
                    </Badge>
                    <Toggle on={leadSquaredConnected} onChange={setLeadSquaredConnected} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-white/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-bad/10 text-lg">🔴</div>
                    <div>
                      <div className="text-sm font-bold">Zoho CRM</div>
                      <div className="text-xs text-sub">Custom fields for unit configuration & budget</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={zohoConnected ? "good" : "neutral"}>
                      {zohoConnected ? "Connected" : "Not connected"}
                    </Badge>
                    <Toggle on={zohoConnected} onChange={setZohoConnected} />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel className="p-5 space-y-4" delay={60}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-sm font-bold tracking-tight">Developer Webhooks & Keys</h2>
                <p className="font-mono text-[10px] text-sub mt-0.5">Real-time webhook events</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Webhook Payload Destination</Label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white/80 px-3 py-2 font-mono text-xs outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
                  />
                  <div className="mt-1 text-[10px] text-sub">Triggers on: call.ended, lead.qualified, dnd.requested</div>
                </div>

                <div className="rounded-xl border border-line/70 bg-canvas/40 p-3">
                  <div className="flex items-center justify-between">
                    <Label>API Secret Key</Label>
                    <button
                      type="button"
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      className="text-xs font-semibold text-azure hover:underline"
                    >
                      {apiKeyVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type={apiKeyVisible ? "text" : "password"}
                      readOnly
                      value="hld_live_948f293a00c8b417e291f"
                      className="w-full rounded border border-line bg-white px-2.5 py-1.5 font-mono text-xs text-sub outline-none"
                    />
                    <ButtonGhost onClick={handleSave} className="py-1 px-2.5 text-xs">
                      Copy
                    </ButtonGhost>
                  </div>
                </div>
              </div>
            </Panel>
          </section>
        </div>
      )}

      {/* TAB 5: TEAM & ROLES */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-3">
            <Panel className="p-5 lg:col-span-2 space-y-4" delay={0}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 pb-3">
                <div>
                  <h2 className="text-base font-bold tracking-tight">Team Members & Access</h2>
                  <p className="font-mono text-xs text-sub mt-0.5">
                    Colleagues with access to call recordings, lead follow-ups, and project configurations
                  </p>
                </div>
                <ButtonAzure onClick={() => setShowInviteModal(true)}>+ Invite Member</ButtonAzure>
              </div>

              <div className="divide-y divide-line/70">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-ink font-mono text-sm font-bold text-white">
                        {member.initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{member.name}</div>
                        <div className="text-xs text-sub font-mono">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={member.role === "Admin" ? "azure" : "neutral"}>{member.role}</Badge>
                      <Badge tone={member.status === "Active" ? "good" : "warn"}>{member.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-5 space-y-4" delay={60}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-sm font-bold tracking-tight">Role Permissions</h2>
                <p className="font-mono text-[10px] text-sub mt-0.5">Access control policy</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="rounded-xl border border-line/70 bg-canvas/50 p-3">
                  <div className="font-bold text-ink">Admin</div>
                  <div className="text-sub mt-0.5">Full access to billing, agent voice scripts, API keys, and team roles.</div>
                </div>
                <div className="rounded-xl border border-line/70 bg-canvas/50 p-3">
                  <div className="font-bold text-ink">Sales Manager</div>
                  <div className="text-sub mt-0.5">Can schedule campaigns, reassign leads, and inspect full transcripts.</div>
                </div>
                <div className="rounded-xl border border-line/70 bg-canvas/50 p-3">
                  <div className="font-bold text-ink">Lead Specialist</div>
                  <div className="text-sub mt-0.5">Access to leads drawer, follow-ups, and customer phone contacts.</div>
                </div>
              </div>
            </Panel>
          </section>
        </div>
      )}

      {/* TAB 6: BILLING & PLANS */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-3">
            <Panel className="p-5 lg:col-span-2 space-y-4" delay={0}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-base font-bold tracking-tight">Current Subscription & Usage</h2>
                <p className="font-mono text-xs text-sub mt-0.5">
                  Plan overview and AI call minutes consumption for this billing cycle
                </p>
              </div>

              <div className="rounded-2xl border border-azure/20 bg-azure/5 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Badge tone="azure">Enterprise Calling Tier</Badge>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-ink">Growth Pro</h3>
                    <p className="text-xs text-sub">Unlimited agents · Priority voice synthesis channels</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-ink">₹19,999</div>
                    <div className="font-mono text-xs text-sub">per month · renews 1 Apr 2026</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Call Minutes Consumed</span>
                    <span className="font-mono">1,284 / 2,500 mins (51%)</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                    <div className="h-full rounded-full bg-azure transition-all" style={{ width: "51.3%" }} />
                  </div>
                  <div className="flex justify-between font-mono text-[11px] text-sub">
                    <span>Overage rate: ₹1.20 / min</span>
                    <span>1,216 minutes remaining</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-line/70 pt-4">
                <h3 className="text-sm font-bold tracking-tight">Recent Invoices</h3>
                <div className="mt-3 divide-y divide-line/70 text-sm">
                  {[
                    { id: "INV-2026-03", date: "01 Mar 2026", amount: "₹19,999", status: "Paid" },
                    { id: "INV-2026-02", date: "01 Feb 2026", amount: "₹19,999", status: "Paid" },
                    { id: "INV-2026-01", date: "01 Jan 2026", amount: "₹19,999", status: "Paid" },
                  ].map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <span className="font-mono font-bold text-xs">{inv.id}</span>
                        <span className="ml-3 text-xs text-sub">{inv.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs">{inv.amount}</span>
                        <Badge tone="good">{inv.status}</Badge>
                        <ButtonGhost className="py-1 px-2 text-xs">PDF</ButtonGhost>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel className="p-5 space-y-4" delay={60}>
              <div className="border-b border-line/70 pb-3">
                <h2 className="text-sm font-bold tracking-tight">Prepaid Calling Wallet</h2>
                <p className="font-mono text-[10px] text-sub mt-0.5">Telephony carrier balance</p>
              </div>

              <div className="rounded-xl border border-line/70 bg-canvas/50 p-4">
                <Label>Wallet Balance</Label>
                <div className="mt-1 text-2xl font-extrabold text-ink">₹18,450.00</div>
                <div className="mt-0.5 font-mono text-[10px] text-good">Sufficient for approx. 3,840 calls</div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-line/70 bg-canvas/50 p-3">
                <div>
                  <div className="text-sm font-semibold">Auto-recharge</div>
                  <div className="text-xs text-sub">Add ₹10,000 when below ₹3,000</div>
                </div>
                <Toggle on={autoRecharge} onChange={setAutoRecharge} />
              </div>

              <div className="rounded-xl border border-line/70 bg-canvas/40 p-3">
                <Label>Payment Method</Label>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                  <span>💳 HDFC Corporate Card</span>
                  <span className="font-mono text-xs text-sub">•••• 8812</span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-sub">Expires 09/28 · Primary</div>
              </div>
            </Panel>
          </section>
        </div>
      )}

      {/* MODAL: ADD NUMBER */}
      <Modal
        open={showAddNumber}
        onClose={() => setShowAddNumber(false)}
        title="Register Outbound Calling Number"
        footer={
          <>
            <ButtonGhost onClick={() => setShowAddNumber(false)}>Cancel</ButtonGhost>
            <ButtonAzure onClick={handleAddNumber}>Register Number</ButtonAzure>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <Label>Phone Number (E.164 Format)</Label>
            <input
              type="tel"
              placeholder="+91 80 1234 5678"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>
          <div>
            <Label>Region / Label</Label>
            <input
              type="text"
              placeholder="e.g. Hyderabad Hub, Delhi NCR"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>
          <SelectField
            label="Telephony Carrier"
            options={["Twilio", "Exotel", "Plivo"]}
            value={newProvider}
          />
        </div>
      </Modal>

      {/* MODAL: INVITE TEAM MEMBER */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        footer={
          <>
            <ButtonGhost onClick={() => setShowInviteModal(false)}>Cancel</ButtonGhost>
            <ButtonAzure onClick={handleInviteMember}>Send Invitation</ButtonAzure>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div>
            <Label>Full Name</Label>
            <input
              type="text"
              placeholder="e.g. Sameer Verma"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>
          <div>
            <Label>Email Address</Label>
            <input
              type="email"
              placeholder="name@haldengroup.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>
          <SelectField
            label="Role & Access Tier"
            options={["Sales Manager", "Lead Specialist", "Viewer", "Admin"]}
            value={inviteRole}
          />
        </div>
      </Modal>
    </AppShell>
  );
}
