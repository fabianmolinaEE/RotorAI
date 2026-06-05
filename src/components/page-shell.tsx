import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

const statAccents = {
  sky: "from-sky-500/18 to-sky-500/4 text-sky-600 dark:text-sky-300",
  emerald: "from-emerald-500/18 to-emerald-500/4 text-emerald-600 dark:text-emerald-300",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-300",
  rose: "from-rose-500/18 to-rose-500/4 text-rose-600 dark:text-rose-300",
  violet: "from-violet-500/18 to-violet-500/4 text-violet-600 dark:text-violet-300",
  slate: "from-slate-500/14 to-slate-500/4 text-slate-600 dark:text-slate-300",
} as const;

type StatAccent = keyof typeof statAccents;

export function Stat({
  label,
  value,
  sub,
  icon: Icon,
  accent = "sky",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  accent?: StatAccent;
}) {
  return (
    <div className="stat-card glass-card group relative rounded-2xl p-4" data-accent={accent}>
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r", statAccents[accent])} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
        {Icon && (
          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/70 bg-gradient-to-br shadow-md ring-1 ring-black/5 dark:border-white/10 dark:ring-white/10", statAccents[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
