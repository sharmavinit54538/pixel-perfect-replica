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
  Label,
  Modal,
  Panel,
  statusTone,
} from "@/components/ui-kit";
import type {
  FollowUp,
  FollowUpMethod,
  FollowUpStatus,
  Priority,
} from "@/types";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — Tutu AI Calling Assistant" },
      {
        name: "description",
        content:
          "Manage buyer follow-up queues across Today, Overdue, Upcoming, and Completed tasks with AI agent and sales team automation.",
      },
    ],
  }),
  component: FollowUpsPage,
});

const tabOptions: FollowUpStatus[] = ["Today", "Overdue", "Upcoming", "Completed"];
const methodOptions: ("All methods" | FollowUpMethod)[] = [
  "All methods",
  "AI Call",
  "Phone Call",
  "WhatsApp",
  "Site Visit",
  "Email",
];

function priorityTone(p: Priority) {
  switch (p) {
    case "High":
      return "bad";
    case "Medium":
      return "warn";
    case "Low":
    default:
      return "neutral";
  }
}

function methodIcon(m: FollowUpMethod) {
  switch (m) {
    case "AI Call":
      return "🤖";
    case "Phone Call":
      return "📞";
    case "WhatsApp":
      return "💬";
    case "Site Visit":
      return "📍";
    case "Email":
      return "✉️";
  }
}

function FollowUpsPage() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [activeTab, setActiveTab] = useState<FollowUpStatus>("Today");
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<"All methods" | FollowUpMethod>("All methods");
  const [projectFilter, setProjectFilter] = useState("All projects");

  // Selection & Modals
  const [selected, setSelected] = useState<FollowUp | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FollowUp | null>(null);
  const [deletingItem, setDeletingItem] = useState<FollowUp | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form inputs
  const [formLeadName, setFormLeadName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formDate, setFormDate] = useState("Today");
  const [formTime, setFormTime] = useState("11:00 AM");
  const [formMethod, setFormMethod] = useState<FollowUpMethod>("AI Call");
  const [formPriority, setFormPriority] = useState<Priority>("High");
  const [formAssignedTo, setFormAssignedTo] = useState("Aria (AI Agent)");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<FollowUpStatus>("Today");

  const projectNames = useMemo(
    () => ["All projects", ...Array.from(new Set(items.map((i) => i.project).filter(Boolean)))],
    [items],
  );

  // Counts for each tab
  const counts = useMemo(() => {
    return {
      Today: items.filter((i) => i.status === "Today").length,
      Overdue: items.filter((i) => i.status === "Overdue").length,
      Upcoming: items.filter((i) => i.status === "Upcoming").length,
      Completed: items.filter((i) => i.status === "Completed").length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchTab = item.status === activeTab;
      const matchMethod = methodFilter === "All methods" || item.method === methodFilter;
      const matchProject = projectFilter === "All projects" || item.project === projectFilter;
      const matchQuery =
        item.leadName.toLowerCase().includes(query.toLowerCase()) ||
        item.phone.includes(query) ||
        item.project.toLowerCase().includes(query.toLowerCase()) ||
        item.reason.toLowerCase().includes(query.toLowerCase());
      return matchTab && matchMethod && matchProject && matchQuery;
    });
  }, [items, activeTab, methodFilter, projectFilter, query]);

  const markCompleted = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "Completed" as FollowUpStatus } : i)),
    );
    if (selected && selected.id === id) {
      setSelected({ ...selected, status: "Completed" });
    }
    setActionSuccess("Follow-up marked as completed!");
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormLeadName("");
    setFormPhone("+91 ");
    setFormProject("");
    setFormReason("");
    setFormDate("Today");
    setFormTime("12:00 PM");
    setFormMethod("AI Call");
    setFormPriority("High");
    setFormAssignedTo("Aria (AI Agent)");
    setFormNotes("");
    setFormStatus("Today");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FollowUp) => {
    setEditingItem(item);
    setFormLeadName(item.leadName);
    setFormPhone(item.phone);
    setFormProject(item.project);
    setFormReason(item.reason);
    setFormDate(item.date);
    setFormTime(item.time);
    setFormMethod(item.method);
    setFormPriority(item.priority);
    setFormAssignedTo(item.assignedTo);
    setFormNotes(item.notes);
    setFormStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!formLeadName.trim()) return;

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                leadName: formLeadName.trim(),
                phone: formPhone.trim(),
                project: formProject,
                reason: formReason.trim(),
                date: formDate,
                time: formTime,
                method: formMethod,
                priority: formPriority,
                assignedTo: formAssignedTo,
                notes: formNotes,
                status: formStatus,
              }
            : i,
        ),
      );
    } else {
      const newItem: FollowUp = {
        id: `fu-${Date.now()}`,
        leadName: formLeadName.trim(),
        phone: formPhone.trim(),
        project: formProject,
        reason: formReason.trim() || "Follow up on customer inquiry",
        date: formDate,
        time: formTime,
        method: formMethod,
        priority: formPriority,
        assignedTo: formAssignedTo,
        notes: formNotes,
        status: formStatus,
      };
      setItems([newItem, ...items]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
    if (selected?.id === deletingItem.id) setSelected(null);
    setDeletingItem(null);
  };

  return (
    <AppShell
      title="Buyer Follow-ups"
      subtitle="Scheduled touches, callbacks, and automated customer nurture workflows"
      actions={
        <div className="flex items-center gap-2">
          {actionSuccess ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-good/10 px-3 py-1.5 font-mono text-xs font-semibold text-good ring-1 ring-good/20">
              ✓ {actionSuccess}
            </span>
          ) : null}
          <ButtonAzure onClick={handleOpenCreate} className="flex items-center gap-1.5">
            <span>+</span>
            <span>Schedule Follow-up</span>
          </ButtonAzure>
        </div>
      }
    >
      <SectionTabs section="crm" />

      {/* Tab Selector */}
      <Panel className="p-1.5" delay={0}>
        <div className="flex overflow-x-auto gap-1">
          {tabOptions.map((tab) => {
            const count = counts[tab];
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-azure text-white shadow-sm font-semibold"
                    : "text-sub hover:bg-black/5 hover:text-ink"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-mono font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : tab === "Overdue" && count > 0
                      ? "bg-bad/10 text-bad"
                      : "bg-ink/5 text-sub"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Filter and Search Bar */}
      <Panel className="flex flex-wrap items-center gap-2 p-3" delay={60}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by buyer name, phone, project, or reason…"
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
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as any)}
          className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none"
        >
          {methodOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Panel>

      {/* Follow-ups Table */}
      <Panel className="overflow-hidden" delay={120}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead>
              <tr className="border-b border-line/70 font-mono text-[10px] uppercase tracking-[0.16em] text-sub">
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Reason / Task</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Due Date & Time</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="cursor-pointer transition-colors hover:bg-azure/5"
                >
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-ink">{item.leadName}</div>
                    <div className="font-mono text-xs text-sub">{item.phone}</div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-sub">{item.project}</td>
                  <td className="px-4 py-3.5 max-w-[280px]">
                    <div className="line-clamp-2 text-ink text-xs leading-relaxed">{item.reason}</div>
                    {item.notes ? (
                      <div className="font-mono text-[10px] text-sub mt-0.5 line-clamp-1">
                        Note: {item.notes}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium">
                      <span>{methodIcon(item.method)}</span>
                      <span>{item.method}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs">
                    <span className={activeTab === "Overdue" ? "font-bold text-bad" : "text-ink"}>
                      {item.date}
                    </span>
                    <span className="block text-[11px] text-sub">{item.time}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={priorityTone(item.priority)}>{item.priority}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.status !== "Completed" ? (
                        <button
                          onClick={() => markCompleted(item.id)}
                          className="rounded-lg bg-good/10 px-2.5 py-1 text-xs font-semibold text-good ring-1 ring-good/20 hover:bg-good/20"
                          title="Mark complete"
                        >
                          ✓ Done
                        </button>
                      ) : null}
                      <ButtonGhost onClick={() => handleOpenEdit(item)} className="px-2.5 py-1 text-xs">
                        Edit
                      </ButtonGhost>
                      <ButtonGhost
                        onClick={() => setDeletingItem(item)}
                        className="px-2 py-1 text-xs text-bad hover:bg-bad/10"
                        
                      >
                        ✕
                      </ButtonGhost>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-sub">
                    {items.length === 0
                      ? "No follow-up tasks recorded yet. Click '+ Schedule Follow-up' to create your first task."
                      : `No follow-ups found matching your filters in the ${activeTab} queue.`}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* CREATE / EDIT MODAL */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit Follow-up for ${editingItem.leadName}` : "Schedule New Follow-up"}
        footer={
          <>
            <ButtonGhost onClick={() => setIsModalOpen(false)}>Cancel</ButtonGhost>
            <ButtonAzure onClick={handleSaveItem}>
              {editingItem ? "Save Changes" : "Schedule Follow-up"}
            </ButtonAzure>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <Label>Lead / Customer Name</Label>
            <input
              type="text"
              value={formLeadName}
              onChange={(e) => setFormLeadName(e.target.value)}
              placeholder="e.g. Priya Menon"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <Label>Phone Contact</Label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+91 98000 00000"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none font-mono"
            />
          </div>

          <div>
            <Label>Associated Project</Label>
            <input
              type="text"
              value={formProject}
              onChange={(e) => setFormProject(e.target.value)}
              placeholder="e.g. Riverside Heights"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </div>

          <div>
            <Label>Contact Method</Label>
            <select
              value={formMethod}
              onChange={(e) => setFormMethod(e.target.value as FollowUpMethod)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="AI Call">🤖 AI Voice Call</option>
              <option value="Phone Call">📞 Manual Phone Call</option>
              <option value="WhatsApp">💬 WhatsApp Message</option>
              <option value="Site Visit">📍 Site Visit Meeting</option>
              <option value="Email">✉️ Email Document</option>
            </select>
          </div>

          <div>
            <Label>Scheduled Date</Label>
            <input
              type="text"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              placeholder="15 Mar 2026"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <Label>Scheduled Time</Label>
            <input
              type="text"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              placeholder="11:30 AM"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <Label>Priority Level</Label>
            <select
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as Priority)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div>
            <Label>Assigned To</Label>
            <select
              value={formAssignedTo}
              onChange={(e) => setFormAssignedTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            >
              <option>Aria (AI Agent)</option>
              <option>Sales Team</option>
              <option>Anika Rao</option>
              <option>Rohan Mehta</option>
            </select>
          </div>

          <div>
            <Label>Target Queue / Status</Label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as FollowUpStatus)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="Today">Today's Queue</option>
              <option value="Upcoming">Upcoming Queue</option>
              <option value="Overdue">Marked Overdue</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label>Follow-up Objective / Reason</Label>
            <input
              type="text"
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="e.g. Discuss 4BHK corner unit availability and review payment schedule"
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Internal CRM Notes</Label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Customer context, preferences, competitor comparisons..."
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* DRAWER DETAILS */}
      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.leadName ?? ""}
        subtitle={selected ? `${selected.phone} · ${selected.project}` : undefined}
        footer={
          <div className="flex gap-2">
            <ButtonGhost className="flex-1" onClick={() => setSelected(null)}>
              Close
            </ButtonGhost>
            {selected && selected.status !== "Completed" ? (
              <ButtonAzure
                className="flex-1"
                onClick={() => {
                  markCompleted(selected.id);
                  setSelected(null);
                }}
              >
                ✓ Mark Completed
              </ButtonAzure>
            ) : null}
          </div>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge tone={priorityTone(selected.priority)}>{selected.priority} Priority</Badge>
              <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
              <span className="font-mono text-xs text-sub">{selected.assignedTo}</span>
            </div>

            <div className="rounded-xl border border-line/70 bg-canvas/60 p-3.5 space-y-2">
              <Label>Task Reason</Label>
              <p className="text-sm font-semibold text-ink leading-relaxed">{selected.reason}</p>
              {selected.notes ? (
                <div className="border-t border-line/60 pt-2 text-xs text-sub">
                  <span className="font-bold text-ink">Notes:</span> {selected.notes}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-line/70 bg-white p-3">
                <Label>Scheduled For</Label>
                <div className="mt-1 font-mono font-bold text-sm text-ink">{selected.date}</div>
                <div className="font-mono text-sub">{selected.time}</div>
              </div>
              <div className="rounded-xl border border-line/70 bg-white p-3">
                <Label>Channel</Label>
                <div className="mt-1 flex items-center gap-1.5 font-bold text-sm text-ink">
                  <span>{methodIcon(selected.method)}</span>
                  <span>{selected.method}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line/70 bg-white p-3 space-y-2 text-xs">
              <Label>Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => alert(`Calling ${selected.leadName} via AI agent...`)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-canvas/60 p-2 font-medium hover:bg-canvas"
                >
                  <span>🤖</span>
                  <span>Trigger AI Call</span>
                </button>
                <button
                  onClick={() => alert(`Opening WhatsApp chat with ${selected.phone}...`)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-line bg-canvas/60 p-2 font-medium hover:bg-canvas"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </button>
              </div>
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
                Edit Task
              </ButtonGhost>
              <ButtonGhost
                onClick={() => {
                  const toDel = selected;
                  setSelected(null);
                  setDeletingItem(toDel);
                }}
                className="text-bad hover:bg-bad/10"
              >
                Delete
              </ButtonGhost>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* DELETE MODAL */}
      <Modal
        open={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        title="Confirm Follow-up Removal"
        footer={
          <>
            <ButtonGhost onClick={() => setDeletingItem(null)}>Cancel</ButtonGhost>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-bad px-3 py-2 text-sm font-semibold text-white hover:bg-bad/90"
            >
              Delete Follow-up
            </button>
          </>
        }
      >
        <p className="text-sm text-sub">
          Are you sure you want to remove the follow-up task for{" "}
          <strong className="text-ink">{deletingItem?.leadName}</strong>? This action cannot be
          undone.
        </p>
      </Modal>
    </AppShell>
  );
}
