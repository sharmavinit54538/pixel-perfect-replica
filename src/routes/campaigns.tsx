import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionTabs } from "@/components/SectionTabs";
import {
  Badge,
  ButtonAzure,
  ButtonDark,
  ButtonGhost,
  Drawer,
  Field,
  Label,
  Modal,
  Panel,
  SelectField,
  statusTone,
} from "@/components/ui-kit";
import type { Campaign, CampaignStatus } from "@/types";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — Tutu AI Calling Assistant" },
      {
        name: "description",
        content:
          "Create, schedule, and optimize AI-driven outbound phone calling campaigns for real-estate buyer qualification.",
      },
    ],
  }),
  component: CampaignsPage,
});

const statusFilterOptions: ("All statuses" | CampaignStatus)[] = [
  "All statuses",
  "Active",
  "Paused",
  "Draft",
  "Completed",
];

function campaignStatusTone(status: CampaignStatus) {
  switch (status) {
    case "Active":
      return "good";
    case "Paused":
      return "warn";
    case "Completed":
      return "azure";
    case "Draft":
    default:
      return "neutral";
  }
}

function CampaignsPage() {
  const [campaignList, setCampaignList] = useState<Campaign[]>([]);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All projects");
  const [statusFilter, setStatusFilter] = useState<"All statuses" | CampaignStatus>("All statuses");

  // Drawer & Modal States
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

  // Form States
  const [formName, setFormName] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formLeadList, setFormLeadList] = useState("");
  const [formAgent, setFormAgent] = useState("Aria · Warm female, EN-IN");
  const [formHours, setFormHours] = useState("10:00 – 18:30 IST");
  const [formMaxAttempts, setFormMaxAttempts] = useState("3");
  const [formRetryInterval, setFormRetryInterval] = useState("4 hours");
  const [formFollowUpRules, setFormFollowUpRules] = useState("");
  const [formLanguages, setFormLanguages] = useState("English, Hindi");
  const [formStatus, setFormStatus] = useState<CampaignStatus>("Active");

  const projectNames = useMemo(
    () => ["All projects", ...Array.from(new Set(campaignList.map((c) => c.project).filter(Boolean)))],
    [campaignList],
  );

  // Summary Metrics
  const activeCount = useMemo(() => campaignList.filter((c) => c.status === "Active").length, [campaignList]);
  const totalDialed = useMemo(() => campaignList.reduce((acc, c) => acc + c.dialed, 0), [campaignList]);
  const totalQualified = useMemo(() => campaignList.reduce((acc, c) => acc + c.qualifiedLeads, 0), [campaignList]);
  const totalVisits = useMemo(() => campaignList.reduce((acc, c) => acc + c.siteVisitsBooked, 0), [campaignList]);

  const filtered = useMemo(() => {
    return campaignList.filter((c) => {
      const matchProject = projectFilter === "All projects" || c.project === projectFilter;
      const matchStatus = statusFilter === "All statuses" || c.status === statusFilter;
      const matchQuery =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.project.toLowerCase().includes(query.toLowerCase()) ||
        c.leadList.toLowerCase().includes(query.toLowerCase()) ||
        c.agent.toLowerCase().includes(query.toLowerCase());
      return matchProject && matchStatus && matchQuery;
    });
  }, [campaignList, query, projectFilter, statusFilter]);

  const toggleStartPause = (campaign: Campaign) => {
    const nextStatus: CampaignStatus = campaign.status === "Active" ? "Paused" : "Active";
    setCampaignList((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c)),
    );
    if (selected && selected.id === campaign.id) {
      setSelected({ ...selected, status: nextStatus });
    }
  };

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setFormName("");
    setFormProject("");
    setFormLeadList("");
    setFormAgent("Aria · Warm female, EN-IN");
    setFormHours("10:00 – 18:30 IST");
    setFormMaxAttempts("3");
    setFormRetryInterval("4 hours");
    setFormFollowUpRules("");
    setFormLanguages("English, Hindi");
    setFormStatus("Active");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormName(campaign.name);
    setFormProject(campaign.project);
    setFormLeadList(campaign.leadList);
    setFormAgent(campaign.agent);
    setFormHours(campaign.callingHours);
    setFormMaxAttempts(campaign.maxAttempts.toString());
    setFormRetryInterval(campaign.retryInterval);
    setFormFollowUpRules(campaign.followUpRules);
    setFormLanguages(campaign.languages.join(", "));
    setFormStatus(campaign.status);
    setIsModalOpen(true);
  };

  const handleSaveCampaign = () => {
    if (!formName.trim()) return;
    const langArray = formLanguages.split(",").map((s) => s.trim()).filter(Boolean);

    if (editingCampaign) {
      setCampaignList((prev) =>
        prev.map((c) =>
          c.id === editingCampaign.id
            ? {
                ...c,
                name: formName.trim(),
                project: formProject,
                leadList: formLeadList.trim() || c.leadList,
                agent: formAgent,
                callingHours: formHours,
                maxAttempts: parseInt(formMaxAttempts, 10) || 3,
                retryInterval: formRetryInterval,
                followUpRules: formFollowUpRules,
                languages: langArray.length > 0 ? langArray : ["English"],
                status: formStatus,
              }
            : c,
        ),
      );
    } else {
      const newCmp: Campaign = {
        id: `cmp-${Date.now()}`,
        name: formName.trim(),
        project: formProject,
        leadList: formLeadList.trim() || "Target List (200)",
        agent: formAgent,
        callingHours: formHours,
        maxAttempts: parseInt(formMaxAttempts, 10) || 3,
        retryInterval: formRetryInterval,
        followUpRules: formFollowUpRules || "Standard qualification sequence.",
        languages: langArray.length > 0 ? langArray : ["English"],
        status: formStatus,
        totalLeads: 250,
        dialed: 0,
        connectedRate: 0,
        qualifiedLeads: 0,
        siteVisitsBooked: 0,
        createdAt: "Today",
      };
      setCampaignList([newCmp, ...campaignList]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deletingCampaign) return;
    setCampaignList((prev) => prev.filter((c) => c.id !== deletingCampaign.id));
    if (selected?.id === deletingCampaign.id) setSelected(null);
    setDeletingCampaign(null);
  };

  return (
    <AppShell
      title="Voice Campaigns"
      subtitle="Outbound AI calling operations for prospective property buyers"
      actions={
        <ButtonAzure onClick={handleOpenCreate} className="flex items-center gap-1.5">
          <span>+</span>
          <span>Create Campaign</span>
        </ButtonAzure>
      }
    >
      <SectionTabs section="projects" />

      {/* Top Metrics Banner */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel className="p-4" delay={0}>
          <Label>Active Campaigns</Label>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-ink">{activeCount}</div>
          <div className="font-mono text-[11px] text-sub">{campaignList.length} total registered</div>
        </Panel>
        <Panel className="p-4" delay={60}>
          <Label>Calls Dialed</Label>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-ink">{totalDialed.toLocaleString()}</div>
          <div className="font-mono text-[11px] text-good">Across all campaigns</div>
        </Panel>
        <Panel className="p-4" delay={120}>
          <Label>Qualified Leads</Label>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-good">{totalQualified}</div>
          <div className="font-mono text-[11px] text-sub">Ready for site visits</div>
        </Panel>
        <Panel className="p-4" delay={180}>
          <Label>Site Visits Booked</Label>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-azure">{totalVisits}</div>
          <div className="font-mono text-[11px] text-sub">Directly from AI calls</div>
        </Panel>
      </section>

      {/* Filter and Search Bar */}
      <Panel className="flex flex-wrap items-center gap-2 p-3" delay={200}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by campaign name, lead list, or AI agent…"
          className="min-w-[220px] flex-1 rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
        />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none"
        >
          {projectNames.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none"
        >
          {statusFilterOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Panel>

      {/* Campaigns Grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c, i) => {
          const progress = Math.min(100, Math.round((c.dialed / (c.totalLeads || 1)) * 100));
          return (
            <Panel key={c.id} className="flex flex-col justify-between p-5" delay={i * 50}>
              <div>
                {/* Header & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge tone={campaignStatusTone(c.status)}>{c.status}</Badge>
                    <h2 className="mt-2 text-base font-bold tracking-tight text-ink">{c.name}</h2>
                    <p className="font-mono text-xs text-sub">{c.project}</p>
                  </div>
                  <button
                    onClick={() => setSelected(c)}
                    className="rounded-md border border-line bg-white/60 px-2 py-1 text-xs text-sub hover:bg-white hover:text-ink"
                    title="View details"
                  >
                    Details ↗
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between font-mono text-xs text-sub">
                    <span>Calling Progress</span>
                    <span className="font-bold text-ink">
                      {c.dialed} / {c.totalLeads} ({progress}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-azure transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-line/70 bg-canvas/60 p-2.5 text-center">
                  <div>
                    <Label>Connected</Label>
                    <div className="mt-0.5 font-mono text-xs font-bold text-ink">{c.connectedRate}%</div>
                  </div>
                  <div>
                    <Label>Qualified</Label>
                    <div className="mt-0.5 font-mono text-xs font-bold text-good">{c.qualifiedLeads}</div>
                  </div>
                  <div>
                    <Label>Visits</Label>
                    <div className="mt-0.5 font-mono text-xs font-bold text-azure">{c.siteVisitsBooked}</div>
                  </div>
                </div>

                {/* Details snapshot */}
                <div className="mt-4 space-y-1.5 text-xs text-sub">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider">AI Voice</span>
                    <span className="font-semibold text-ink truncate max-w-[150px]">{c.agent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider">Hours</span>
                    <span className="font-mono text-[11px] text-ink">{c.callingHours}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider">Max Retries</span>
                    <span className="font-mono text-[11px] text-ink">
                      {c.maxAttempts} attempts · {c.retryInterval}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider">Languages</span>
                    <span className="font-mono text-[11px] text-ink truncate max-w-[160px]">
                      {c.languages.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center gap-2 border-t border-line/70 pt-4">
                <button
                  onClick={() => toggleStartPause(c)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ring-1 transition-colors ${
                    c.status === "Active"
                      ? "bg-warn/10 text-warn ring-warn/30 hover:bg-warn/20"
                      : "bg-good/10 text-good ring-good/30 hover:bg-good/20"
                  }`}
                >
                  {c.status === "Active" ? "⏸ Pause Campaign" : "▶ Start Campaign"}
                </button>
                <ButtonGhost onClick={() => handleOpenEdit(c)} className="px-3 py-2 text-xs">
                  Edit
                </ButtonGhost>
                <ButtonGhost
                  onClick={() => setDeletingCampaign(c)}
                  className="px-2.5 py-2 text-xs text-bad hover:bg-bad/10"
                >
                  ✕
                </ButtonGhost>
              </div>
            </Panel>
          );
        })}

        {filtered.length === 0 ? (
          <Panel className="p-12 text-center text-sm text-sub md:col-span-2 xl:col-span-3">
            {campaignList.length === 0
              ? "No calling campaigns created yet. Click '+ Create Campaign' to launch your first outbound campaign."
              : "No campaigns match your search and filter criteria."}
          </Panel>
        ) : null}
      </section>

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCampaign ? `Edit Campaign: ${editingCampaign.name}` : "Create New AI Calling Campaign"}
        footer={
          <>
            <ButtonGhost onClick={() => setIsModalOpen(false)}>Cancel</ButtonGhost>
            <ButtonAzure onClick={handleSaveCampaign}>
              {editingCampaign ? "Save Changes" : "Create & Launch"}
            </ButtonAzure>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="sm:col-span-2">
            <Label>Campaign Name</Label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Riverside Heights Q1 HNI Outreach"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>

          <div>
            <Label>Target Real Estate Project</Label>
            <input
              type="text"
              value={formProject}
              onChange={(e) => setFormProject(e.target.value)}
              placeholder="e.g. Riverside Heights"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>

          <div>
            <Label>Lead List Source</Label>
            <input
              type="text"
              value={formLeadList}
              onChange={(e) => setFormLeadList(e.target.value)}
              placeholder="e.g. Inbound Portals (350 leads)"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <Label>Assigned Voice Agent</Label>
            <select
              value={formAgent}
              onChange={(e) => setFormAgent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            >
              <option>Aria · Warm female, EN-IN</option>
              <option>Kabir · Calm male, EN-IN</option>
              <option>Nila · Bright female, EN-IN</option>
              <option>Rohan · Deep male, EN-IN</option>
            </select>
          </div>

          <div>
            <Label>Calling Hours Window</Label>
            <input
              type="text"
              value={formHours}
              onChange={(e) => setFormHours(e.target.value)}
              placeholder="10:00 – 18:30 IST"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <Label>Max Attempts Per Lead</Label>
            <select
              value={formMaxAttempts}
              onChange={(e) => setFormMaxAttempts(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="1">1 attempt</option>
              <option value="2">2 attempts</option>
              <option value="3">3 attempts (Recommended)</option>
              <option value="4">4 attempts</option>
              <option value="5">5 attempts</option>
            </select>
          </div>

          <div>
            <Label>Retry Delay Interval</Label>
            <select
              value={formRetryInterval}
              onChange={(e) => setFormRetryInterval(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="2 hours">2 hours</option>
              <option value="4 hours">4 hours</option>
              <option value="6 hours">6 hours</option>
              <option value="12 hours">12 hours</option>
              <option value="24 hours">24 hours</option>
            </select>
          </div>

          <div>
            <Label>Languages (Comma separated)</Label>
            <input
              type="text"
              value={formLanguages}
              onChange={(e) => setFormLanguages(e.target.value)}
              placeholder="English, Hindi, Kannada"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <Label>Initial Status</Label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as CampaignStatus)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="Active">Active (Ready to Dial)</option>
              <option value="Paused">Paused</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label>Follow-Up & Escalation Rules</Label>
            <textarea
              rows={3}
              value={formFollowUpRules}
              onChange={(e) => setFormFollowUpRules(e.target.value)}
              placeholder="e.g. If lead expresses high interest, book site visit immediately. Send brochure over WhatsApp."
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* DETAILS DRAWER */}
      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.project} · Created ${selected.createdAt}` : undefined}
        footer={
          <div className="flex gap-2">
            <ButtonGhost className="flex-1" onClick={() => setSelected(null)}>
              Close
            </ButtonGhost>
            {selected ? (
              <ButtonAzure
                className="flex-1"
                onClick={() => {
                  toggleStartPause(selected);
                }}
              >
                {selected.status === "Active" ? "Pause Campaign" : "Start Campaign"}
              </ButtonAzure>
            ) : null}
          </div>
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge tone={campaignStatusTone(selected.status)}>{selected.status}</Badge>
              <span className="font-mono text-xs text-sub">{selected.leadList}</span>
            </div>

            <div className="rounded-xl border border-line/70 bg-canvas/60 p-3.5 space-y-3">
              <Label>Calling Performance</Label>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-white p-2.5">
                  <div className="font-mono text-xl font-extrabold text-ink">{selected.dialed}</div>
                  <div className="font-mono text-[10px] text-sub">Leads Dialed</div>
                </div>
                <div className="rounded-lg bg-white p-2.5">
                  <div className="font-mono text-xl font-extrabold text-good">{selected.connectedRate}%</div>
                  <div className="font-mono text-[10px] text-sub">Answer Rate</div>
                </div>
                <div className="rounded-lg bg-white p-2.5">
                  <div className="font-mono text-xl font-extrabold text-azure">{selected.qualifiedLeads}</div>
                  <div className="font-mono text-[10px] text-sub">Qualified Buyers</div>
                </div>
                <div className="rounded-lg bg-white p-2.5">
                  <div className="font-mono text-xl font-extrabold text-ink">{selected.siteVisitsBooked}</div>
                  <div className="font-mono text-[10px] text-sub">Visits Booked</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Campaign Configurations</Label>
              <div className="divide-y divide-line/70 text-xs">
                <div className="flex justify-between py-2">
                  <span className="text-sub">AI Voice Agent:</span>
                  <span className="font-semibold text-ink">{selected.agent}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sub">Operating Hours:</span>
                  <span className="font-mono text-ink">{selected.callingHours}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sub">Max Retries:</span>
                  <span className="font-mono text-ink">
                    {selected.maxAttempts} attempts every {selected.retryInterval}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sub">Languages:</span>
                  <span className="font-semibold text-ink">{selected.languages.join(", ")}</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Automation Rules</Label>
              <p className="mt-1 rounded-lg border border-line bg-canvas/60 p-3 text-xs leading-relaxed text-sub">
                {selected.followUpRules}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <ButtonGhost
                onClick={() => {
                  const toEdit = selected;
                  setSelected(null);
                  handleOpenEdit(toEdit);
                }}
                className="flex-1"
              >
                Edit Settings
              </ButtonGhost>
              <ButtonGhost
                onClick={() => {
                  const toDel = selected;
                  setSelected(null);
                  setDeletingCampaign(toDel);
                }}
                className="text-bad hover:bg-bad/10"
              >
                Delete
              </ButtonGhost>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        open={deletingCampaign !== null}
        onClose={() => setDeletingCampaign(null)}
        title="Confirm Campaign Deletion"
        footer={
          <>
            <ButtonGhost onClick={() => setDeletingCampaign(null)}>Cancel</ButtonGhost>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-bad px-3 py-2 text-sm font-semibold text-white hover:bg-bad/90"
            >
              Delete Campaign
            </button>
          </>
        }
      >
        <p className="text-sm text-sub">
          Are you sure you want to delete{" "}
          <strong className="text-ink">{deletingCampaign?.name}</strong>? All dialer queues and
          associated pending tasks will be permanently removed.
        </p>
      </Modal>
    </AppShell>
  );
}
