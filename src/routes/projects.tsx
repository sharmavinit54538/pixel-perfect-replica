import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SectionTabs } from "@/components/SectionTabs";
import {
  Badge,
  ButtonAzure,
  ButtonGhost,
  Field,
  Label,
  Modal,
  Panel,
  SelectField,
  statusTone,
} from "@/components/ui-kit";
import type { Project } from "@/types";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Tutu AI Calling Assistant" },
      { name: "description", content: "Browse builder projects with location, pricing, configuration and sales status, and add or edit listings." },
      { property: "og:title", content: "Projects — Tutu AI Calling Assistant" },
      { property: "og:description", content: "Browse builder projects with location, pricing, configuration and sales status." },
    ],
  }),
  component: ProjectsPage,
});

const statuses = ["All statuses", "Selling", "Pre-launch", "Sold out"];

function ProjectsPage() {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(statuses[0]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formConfig, setFormConfig] = useState("");
  const [formStatus, setFormStatus] = useState<Project["status"]>("Selling");
  const [formUnits, setFormUnits] = useState("");

  const handleOpenAdd = () => {
    setEditing(null);
    setFormName("");
    setFormLocation("");
    setFormPrice("");
    setFormConfig("");
    setFormStatus("Selling");
    setFormUnits("");
    setOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditing(p);
    setFormName(p.name);
    setFormLocation(p.location);
    setFormPrice(p.price);
    setFormConfig(p.configuration);
    setFormStatus(p.status);
    setFormUnits(p.unitsNote);
    setOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      setOpen(false);
      return;
    }
    if (editing) {
      setProjectsList((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                name: formName,
                location: formLocation,
                price: formPrice,
                configuration: formConfig,
                status: formStatus,
                unitsNote: formUnits,
              }
            : p
        )
      );
    } else {
      const newProj: Project = {
        id: `p-${Date.now()}`,
        name: formName,
        location: formLocation || "Bengaluru",
        price: formPrice || "Price on request",
        configuration: formConfig || "2 & 3 BHK",
        status: formStatus,
        soldPercent: 0,
        unitsNote: formUnits || "Available now",
      };
      setProjectsList((prev) => [newProj, ...prev]);
    }
    setOpen(false);
  };

  const filtered = useMemo(
    () =>
      projectsList.filter(
        (p) =>
          (status === "All statuses" || p.status === status) &&
          (p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.location.toLowerCase().includes(query.toLowerCase())),
      ),
    [projectsList, query, status],
  );

  return (
    <AppShell
      actions={
        <ButtonAzure
          className="hidden sm:block"
          onClick={handleOpenAdd}
        >
          Add project
        </ButtonAzure>
      }
    >
      <SectionTabs section="projects" />

      <Panel className="flex flex-wrap items-center gap-2 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or location…"
          className="min-w-[200px] flex-1 rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none"
        >
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <ButtonGhost onClick={handleOpenAdd}>
          Add project
        </ButtonGhost>
      </Panel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p, i) => (
          <Panel key={p.id} className="p-4" delay={i * 60}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold tracking-tight">{p.name}</h2>
                <p className="font-mono text-[11px] text-sub">{p.location}</p>
              </div>
              <Badge tone={statusTone(p.status)}>{p.status}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <Label>Price</Label>
                <div className="text-sm font-semibold">{p.price}</div>
              </div>
              <div>
                <Label>Configuration</Label>
                <div className="text-sm font-semibold">{p.configuration}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-azure" style={{ width: `${p.soldPercent}%` }} />
              </div>
              <div className="mt-1 font-mono text-[10px] text-sub">
                {p.soldPercent}% sold · {p.unitsNote}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <ButtonGhost
                className="flex-1"
                onClick={() => handleOpenEdit(p)}
              >
                Edit
              </ButtonGhost>
              <ButtonGhost className="flex-1">Assign to agent</ButtonGhost>
            </div>
          </Panel>
        ))}
        {filtered.length === 0 ? (
          <Panel className="p-8 text-center text-sm text-sub md:col-span-2 xl:col-span-3">
            {projectsList.length === 0
              ? "No projects recorded yet. Click 'Add project' to create your first project."
              : "No projects match this search filter."}
          </Panel>
        ) : null}
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add project"}
        footer={
          <>
            <ButtonGhost onClick={() => setOpen(false)}>Cancel</ButtonGhost>
            <ButtonAzure onClick={handleSave}>{editing ? "Save changes" : "Create project"}</ButtonAzure>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-sub">
            Project name
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Riverside Heights"
              className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-sub">
            Location
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="e.g. Hebbal, Bengaluru"
              className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-sub">
            Starting price
            <input
              type="text"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              placeholder="e.g. ₹2.4 Cr onwards"
              className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-sub">
            Configuration
            <input
              type="text"
              value={formConfig}
              onChange={(e) => setFormConfig(e.target.value)}
              placeholder="e.g. 3 & 4 BHK"
              className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-sub">
            Status
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as Project["status"])}
              className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50"
            >
              <option value="Selling">Selling</option>
              <option value="Pre-launch">Pre-launch</option>
              <option value="Sold out">Sold out</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-sub">
            Units note
            <input
              type="text"
              value={formUnits}
              onChange={(e) => setFormUnits(e.target.value)}
              placeholder="e.g. 12 units left"
              className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
            />
          </label>
        </div>
      </Modal>
    </AppShell>
  );
}
