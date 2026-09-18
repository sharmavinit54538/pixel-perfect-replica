import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building,
  Megaphone,
  BrainCircuit,
  PhoneCall,
  BellRing,
  UserRound,
  CalendarClock,
  MapPinned,
  type LucideIcon,
} from "lucide-react";

interface SubNavTab {
  to: string;
  label: string;
  icon: LucideIcon;
}

const projectsTabs: readonly SubNavTab[] = [
  { to: "/projects", label: "Projects", icon: Building },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
];

const communicationTabs: readonly SubNavTab[] = [
  { to: "/agent", label: "AI Agent", icon: BrainCircuit },
  { to: "/calls", label: "Calls", icon: PhoneCall },
  { to: "/notifications", label: "Notifications", icon: BellRing },
];

const crmTabs: readonly SubNavTab[] = [
  { to: "/leads", label: "Leads", icon: UserRound },
  { to: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { to: "/site-visits", label: "Site Visits", icon: MapPinned },
];

export function SectionTabs({ section }: { section: "projects" | "communication" | "crm" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const tabs =
    section === "projects"
      ? projectsTabs
      : section === "communication"
        ? communicationTabs
        : crmTabs;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 rounded-xl border border-line/80 bg-white/70 p-1 shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.to || (tab.to !== "/" && pathname.startsWith(`${tab.to}/`));
          return (
            <Link
              key={tab.to}
              to={tab.to as any}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-azure/10 text-azure font-bold ring-1 ring-azure/20 shadow-xs"
                  : "text-sub hover:bg-black/5 hover:text-ink"
              }`}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.9} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
