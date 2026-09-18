import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={`rise panel min-w-0 ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const tones = {
  good: "bg-good/10 text-good ring-good/20",
  bad: "bg-bad/10 text-bad ring-bad/20",
  warn: "bg-warn/10 text-warn ring-warn/20",
  azure: "bg-azure/10 text-azure ring-azure/20",
  neutral: "bg-ink/5 text-sub ring-ink/10",
} as const;

export type Tone = keyof typeof tones;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "Interested":
    case "Hot":
    case "Selling":
      return "good";
    case "Not Interested":
    case "Cold":
      return "bad";
    case "Follow-up":
    case "Warm":
    case "Pre-launch":
      return "warn";
    default:
      return "azure";
  }
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sub">{children}</span>
  );
}

export function Field({
  label,
  value,
  placeholder,
  type = "text",
}: {
  label: string;
  value?: string | undefined;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sub">{label}</span>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
      />
    </label>
  );
}

export function SelectField({
  label,
  options,
  value,
}: {
  label: string;
  options: string[];
  value?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sub">{label}</span>
      <select
        defaultValue={value}
        className="mt-1.5 w-full rounded-lg border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-azure/50 focus:ring-2 focus:ring-azure/15"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange?.(!on)}
      className={`h-5 w-9 rounded-full p-0.5 ring-1 transition-colors ${
        on ? "bg-good ring-good/20" : "bg-line ring-black/5"
      }`}
    >
      <div className={`size-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
    </button>
  );
}

export function ButtonDark({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white ring-1 ring-black/5 hover:bg-ink/90 ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonAzure({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg bg-azure px-3 py-2 text-sm font-semibold text-white ring-1 ring-black/5 hover:bg-azure/90 ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonGhost({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border border-line bg-white/70 px-3 py-2 text-sm font-medium text-sub hover:bg-white ${className}`}
    >
      {children}
    </button>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-line/70 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold tracking-tight">{title}</h2>
            {subtitle ? <p className="font-mono text-[11px] text-sub">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sub hover:bg-black/5">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-line/70 px-5 py-4">{footer}</div> : null}
      </aside>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight">{title}</h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sub hover:bg-black/5">
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
