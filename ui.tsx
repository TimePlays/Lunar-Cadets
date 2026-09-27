import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Info, TriangleAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel p-4 ${className}`}>
      {(title || right) && (
        <header className="mb-3 flex items-center justify-between gap-3 border-b border-border/70 pb-2">
          <h3 className="hud-label text-foreground/80">{title}</h3>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Meter({
  label,
  value,
  unit = "%",
  danger = 20,
  warn = 40,
  icon,
  invert = false,
}: {
  label: string;
  value: number;
  unit?: string;
  danger?: number;
  warn?: number;
  icon?: ReactNode;
  invert?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  const critical = invert ? v >= danger : v <= danger;
  const caution = invert ? v >= warn : v <= warn;
  const color = critical ? "var(--destructive)" : caution ? "var(--caution)" : "var(--go)";
  return (
    <div className={`rounded-md border border-border/70 bg-background/40 p-2 ${critical ? "alarm-pulse" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="hud-label flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="readout text-sm font-semibold" style={{ color }}>
          {critical && <TriangleAlert className="mr-1 inline size-3" aria-hidden />}
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${v}%`, background: color }}
        />
      </div>
      {critical && (
        <p className="readout mt-1 text-[10px] uppercase tracking-widest text-destructive">
          {label} critical
        </p>
      )}
    </div>
  );
}

export function GameButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "accent";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const styles: Record<string, string> = {
    primary:
      "bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_24px_-8px_var(--primary)]",
    accent: "bg-accent text-accent-foreground hover:brightness-110",
    ghost: "bg-secondary/60 text-foreground hover:bg-secondary border border-border",
    danger: "bg-destructive text-destructive-foreground hover:brightness-110",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`readout rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function NavButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="readout rounded-md border border-border bg-secondary/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-secondary"
    >
      {children}
    </Link>
  );
}

/** Typewriter transmission line with subtitle styling. */
export function Transmission({
  from,
  text,
  speed = 22,
  onDone,
}: {
  from: string;
  text: string;
  speed?: number;
  onDone?: () => void;
}) {
  const [shown, setShown] = useState("");
  const done = useRef(false);
  useEffect(() => {
    setShown("");
    done.current = false;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        if (!done.current) {
          done.current = true;
          onDone?.();
        }
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, onDone]);
  return (
    <div className="panel flex gap-3 p-3">
      <div className="mt-0.5 size-2 shrink-0 animate-pulse rounded-full bg-primary" />
      <p className="text-sm leading-relaxed">
        <span className="hud-label mr-2 text-primary">{from}</span>
        <span className="text-foreground/90">{shown}</span>
        <span className="ml-0.5 inline-block w-1.5 animate-pulse">▍</span>
      </p>
    </div>
  );
}

/** "Why did that happen?" contextual real-science explainer. */
export function WhyBox({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-primary/40 bg-primary/5 p-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="hud-label flex w-full items-center gap-2 text-primary"
      >
        <Info className="size-3.5" aria-hidden />
        why did that happen? — {title}
      </button>
      {open && <p className="mt-2 text-xs leading-relaxed text-foreground/85">{children}</p>}
    </div>
  );
}

export function Caution({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-caution/50 bg-caution/10 p-2 text-xs text-foreground/90">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-caution" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/40 px-3 py-2">
      <div className="hud-label">{label}</div>
      <div className={`readout text-lg font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
