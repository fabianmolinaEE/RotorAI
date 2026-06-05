import { cn } from "@/lib/utils";
import type { Bay, Technician, WorkOrder } from "@/data/types";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: {
    label: "Active",
    dotClass: "bg-green-500",
    borderClass: "border-green-500/40",
    bgClass: "bg-green-500/5",
    badgeClass: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  empty: {
    label: "Empty",
    dotClass: "bg-muted-foreground/40",
    borderClass: "border-border",
    bgClass: "",
    badgeClass: "bg-muted text-muted-foreground",
  },
  offline: {
    label: "Offline",
    dotClass: "bg-destructive/60",
    borderClass: "border-destructive/30",
    bgClass: "bg-destructive/5",
    badgeClass: "bg-destructive/15 text-destructive",
  },
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────
interface BayBoardProps {
  bays: Bay[];
  techById: Map<string, Technician>;
  woById: Map<string, WorkOrder>;
  /** Optional: called when user clicks an Empty bay card */
  onAssign?: (bayId: string) => void;
}

// ─── Individual bay card ──────────────────────────────────────────────────────
interface BayCardProps {
  bay: Bay;
  tech: Technician | undefined;
  wo: WorkOrder | undefined;
  onAssign?: (bayId: string) => void;
}

function BayCard({ bay, tech, wo, onAssign }: BayCardProps) {
  const cfg = STATUS_CONFIG[bay.status];
  const isClickable = bay.status === "empty" && !!onAssign;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onAssign?.(bay.id) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAssign?.(bay.id);
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border p-4 transition-colors",
        cfg.borderClass,
        cfg.bgClass,
        isClickable && "cursor-pointer hover:bg-primary/5 hover:border-primary/40",
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{bay.label}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
            cfg.badgeClass,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotClass)} />
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      {bay.status === "active" && (
        <div className="mt-3 space-y-1">
          {tech && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{tech.name}</span>
              {" · "}
              {tech.specialty}
            </div>
          )}
          {wo && (
            <div className="text-xs text-muted-foreground line-clamp-1">{wo.title}</div>
          )}
          {bay.note && !wo && (
            <div className="text-xs italic text-muted-foreground line-clamp-1">{bay.note}</div>
          )}
        </div>
      )}

      {bay.status === "empty" && (
        <div className="mt-3 text-xs text-muted-foreground">
          {onAssign ? "Click to assign a ticket" : "Available"}
        </div>
      )}

      {bay.status === "offline" && bay.note && (
        <div className="mt-3 text-xs italic text-muted-foreground line-clamp-2">{bay.note}</div>
      )}
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
export function BayBoard({ bays, techById, woById, onAssign }: BayBoardProps) {
  const active = bays.filter((b) => b.status === "active").length;
  const empty = bays.filter((b) => b.status === "empty").length;
  const offline = bays.filter((b) => b.status === "offline").length;

  return (
    <section>
      {/* Summary strip */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-green-600 dark:text-green-400">{active}</span> active
        </span>
        <span>
          <span className="font-semibold text-foreground">{empty}</span> empty
        </span>
        {offline > 0 && (
          <span>
            <span className="font-semibold text-destructive">{offline}</span> offline
          </span>
        )}
      </div>

      {/* Bay grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bays.map((bay) => (
          <BayCard
            key={bay.id}
            bay={bay}
            tech={bay.technicianId ? techById.get(bay.technicianId) : undefined}
            wo={bay.workOrderId ? woById.get(bay.workOrderId) : undefined}
            onAssign={onAssign}
          />
        ))}
      </div>
    </section>
  );
}
