import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutGrid,
  Building,
  Megaphone,
  BrainCircuit,
  PhoneCall,
  UserRound,
  CalendarClock,
  MapPinned,
  TrendingUp,
  BellRing,
  Settings,
  PanelLeft,
  Search,
  MessageSquare,
  Users,
  ChevronDown,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { PhoneDialerModal } from "@/components/PhoneDialerModal";
import {
  getActiveCallState,
  setDialerOpen,
  subscribeCallStore,
  type ActiveCallState,
} from "@/lib/call-store";
interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  activeMatch?: string[];
}

const navEntries: readonly NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutGrid,
    exact: true,
  },
  {
    to: "/projects",
    label: "Projects",
    icon: Building,
    activeMatch: ["/projects", "/campaigns"],
  },
  {
    to: "/agent",
    label: "Communication",
    icon: MessageSquare,
    activeMatch: ["/agent", "/calls", "/notifications"],
  },
  {
    to: "/leads",
    label: "CRM",
    icon: Users,
    activeMatch: ["/leads", "/follow-ups", "/site-visits"],
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: TrendingUp,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

function NavLinks({
  onNavigate,
  collapsed,
}: {
  onNavigate?: (() => void) | undefined;
  collapsed?: boolean | undefined;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Main Navigation">
      {navEntries.map((item) => {
        const Icon = item.icon;
        const isActive = item.activeMatch
          ? item.activeMatch.some((p) => pathname === p || pathname.startsWith(`${p}/`))
          : item.exact
            ? pathname === item.to
            : pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));

        return (
          <Link
            key={item.to}
            to={item.to as any}
            onClick={onNavigate}
            activeOptions={{ exact: Boolean(item.exact) }}
            title={collapsed ? item.label : undefined}
            className={`group relative flex items-center ${
              collapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2"
            } rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-azure/10 text-azure font-semibold ring-1 ring-azure/15"
                : "text-sub hover:bg-black/5 hover:text-ink"
            }`}
          >
            <span className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <span className="flex size-5 shrink-0 items-center justify-center text-current" aria-hidden="true">
                <Icon size={19} strokeWidth={1.9} className="size-5 shrink-0" />
              </span>
              {!collapsed ? <span>{item.label}</span> : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  onNavigate,
  onToggle,
  collapsed,
}: {
  onNavigate?: () => void;
  onToggle?: () => void;
  collapsed?: boolean;
}) {
  return (
    <>
      <div className={`mb-5 flex items-center ${collapsed ? "justify-center" : "justify-between"} px-1`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="group relative size-9 rounded-xl overflow-hidden ring-1 ring-black/10 shrink-0 hover:scale-105 transition-all shadow-xs"
          >
            <img
              src="/tutu-logo.png"
              alt="Tutu"
              className="size-full object-cover rounded-xl"
            />
          </button>
        ) : (
          <>
            <Link to="/" title="Tutu" className="flex items-center hover:opacity-90 transition-opacity">
              <div className="size-9 rounded-xl overflow-hidden ring-1 ring-black/10 shrink-0 shadow-xs">
                <img
                  src="/tutu-logo.png"
                  alt="Tutu"
                  className="size-full object-cover rounded-xl"
                />
              </div>
            </Link>
            {onToggle ? (
              <button
                type="button"
                onClick={onToggle}
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
                className="rounded-lg p-1.5 text-sub hover:bg-black/5 hover:text-ink transition-colors flex items-center justify-center shrink-0"
              >
                <PanelLeft size={19} strokeWidth={1.9} />
              </button>
            ) : null}
          </>
        )}
      </div>
      <NavLinks onNavigate={onNavigate} collapsed={collapsed} />

    </>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [callState, setCallState] = useState<ActiveCallState>(getActiveCallState());

  useEffect(() => {
    const unsubscribe = subscribeCallStore(() => {
      setCallState({ ...getActiveCallState() });
    });
    return unsubscribe;
  }, []);

  const isCallActive =
    callState.status === "dialing" ||
    callState.status === "ringing" ||
    callState.status === "connected";

  return (
    <div className="app-bg min-h-screen bg-canvas font-sans text-ink antialiased">
      <PhoneDialerModal />
      <div className="flex">
        <aside
          className={`sticky top-0 hidden h-screen ${
            collapsed ? "w-16 px-2" : "w-64 px-3"
          } shrink-0 flex-col border-r border-line/80 bg-white/60 py-5 backdrop-blur-xl transition-[width,padding] duration-200 ease-in-out md:flex`}
        >
          <SidebarInner
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        </aside>

        {open ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-white px-3 py-5">
              <SidebarInner
                onNavigate={() => setOpen(false)}
                onToggle={() => setOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line/70 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-6">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open sidebar"
              title="Open sidebar"
              className="rounded-lg border border-line bg-white/70 p-2 text-sm text-sub hover:text-ink md:hidden transition-colors flex items-center justify-center"
            >
              <PanelLeft size={18} aria-hidden="true" />
            </button>
            <div className="ml-auto hidden items-center gap-2 rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-sub xl:flex">
              <Search size={16} className="text-sub shrink-0" aria-hidden="true" />
              <span className="text-sub/80">Search calls, leads, campaigns…</span>
              <kbd className="ml-4 rounded border border-line bg-canvas px-1.5 font-mono text-[10px]">⌘K</kbd>
            </div>

            {/* Phone Dialer Button / Live Call Pill */}
            {isCallActive ? (
              <button
                type="button"
                onClick={() => setDialerOpen(true)}
                className="relative ml-auto flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-xs xl:ml-0"
                title="View Active Live Call"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                </span>
                <Phone size={14} className="text-emerald-600 animate-pulse" />
                <span>
                  Live Call (
                  {Math.floor(callState.durationSeconds / 60)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {(callState.durationSeconds % 60).toString().padStart(2, "0")})
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDialerOpen(true)}
                className="relative ml-auto flex items-center gap-1.5 rounded-xl border border-line/90 bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-xs hover:border-azure/50 hover:bg-white hover:text-azure transition-all xl:ml-0"
                title="Open Phone Dialer (0-9 Keypad & Contacts)"
              >
                <Phone size={14} className="text-azure" />
                <span className="hidden sm:inline">Phone Dialer</span>
                <span className="rounded bg-azure/10 px-1 py-0.2 font-mono text-[10px] text-azure font-bold">
                  0-9
                </span>
              </button>
            )}

            {/* Notification Bell */}
            <Link
              to={"/notifications" as any}
              className="relative flex items-center justify-center rounded-lg border border-line bg-white/80 p-2 text-sub hover:bg-white hover:text-ink transition-colors"
              title="Notifications"
            >
              <BellRing size={18} className="shrink-0" aria-hidden="true" />
            </Link>

            {actions ? (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            ) : null}
          </header>

          <main className="flex-1 space-y-4 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
