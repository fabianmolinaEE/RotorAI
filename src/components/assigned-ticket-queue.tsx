import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, MessageSquare, Package, Wrench } from "lucide-react";
import type { WorkOrder, WorkOrderForemanNote } from "@/data/types";
import { UrgencyBadge } from "@/components/urgency-badge";
import { StatusChip } from "@/components/status-chip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AssignedTicketQueueProps {
  workOrders: WorkOrder[];
  /** Map of workOrderId → foreman note; pre-fetched by parent route */
  foremanNotes: Map<string, WorkOrderForemanNote>;
  /** Map of workOrderId → vehicle display label (e.g. "2019 Honda Civic EX") */
  vehicleLabels: Map<string, string>;
  /** Map of workOrderId → bay label (e.g. "Bay 1") */
  bayLabels: Map<string, string>;
  className?: string;
}

/**
 * Assigned ticket queue for the technician landing.
 *
 * Per locked decision: foreman note, priority, bay assignment, due window, and
 * required parts are shown BEFORE any CAD/model interaction. The CAD viewer is
 * accessible via the "View ticket" link, not on this landing screen directly.
 *
 * Sort order: new assignments with unread foreman notes → high urgency → normal → low.
 */
export function AssignedTicketQueue({
  workOrders,
  foremanNotes,
  vehicleLabels,
  bayLabels,
  className,
}: AssignedTicketQueueProps) {
  const urgencyOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };

  const sorted = [...workOrders]
    .filter((wo) => wo.status !== "completed" && wo.status !== "invoiced")
    .sort((a, b) => {
      // Tickets with a foreman note surface first
      const aN = foremanNotes.has(a.id) ? 0 : 1;
      const bN = foremanNotes.has(b.id) ? 0 : 1;
      if (aN !== bN) return aN - bN;
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

  if (sorted.length === 0) {
    return (
      <div className={cn("rounded-md border border-dashed p-8 text-center text-muted-foreground", className)}>
        No open tickets assigned to you right now.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {sorted.map((wo) => (
        <AssignedTicketCard
          key={wo.id}
          wo={wo}
          foremanNote={foremanNotes.get(wo.id)}
          vehicleLabel={vehicleLabels.get(wo.id)}
          bayLabel={bayLabels.get(wo.id)}
        />
      ))}
    </div>
  );
}

// ─── Individual card ───────────────────────────────────────────────────────────

interface AssignedTicketCardProps {
  wo: WorkOrder;
  foremanNote?: WorkOrderForemanNote;
  vehicleLabel?: string;
  bayLabel?: string;
}

function AssignedTicketCard({ wo, foremanNote, vehicleLabel, bayLabel }: AssignedTicketCardProps) {
  const affectedSystems = wo.subsystems.filter((s) => s.status !== "ok");
  const requiredTools = Array.from(new Set(affectedSystems.flatMap((s) => s.tools))).slice(0, 4);

  const dueLabel = formatDue(wo.etaIso);
  const isHighUrgency = wo.urgency === "high";

  return (
    <div
      className={cn(
        "rounded-md border bg-card p-4 transition-colors",
        isHighUrgency && "border-red-500/40 bg-red-500/5 dark:border-red-400/30 dark:bg-red-400/5",
      )}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-muted-foreground">{wo.number}</span>
            <UrgencyBadge urgency={wo.urgency} />
            <StatusChip status={wo.status} />
          </div>
          <p className="mt-0.5 text-base font-semibold leading-snug">{wo.title}</p>
          {vehicleLabel && (
            <p className="text-sm text-muted-foreground">{vehicleLabel}</p>
          )}
        </div>
      </div>

      {/* Meta row: bay + due window */}
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {bayLabel && (
          <span className="flex items-center gap-1.5">
            <Wrench className="size-3.5 shrink-0" />
            {bayLabel}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5 shrink-0" />
          Due: <span className={cn("font-medium", isHighUrgency ? "text-red-600 dark:text-red-400" : "text-foreground")}>{dueLabel}</span>
        </span>
        {wo.partsCost > 0 && (
          <span className="flex items-center gap-1.5">
            <Package className="size-3.5 shrink-0" />
            Parts estimated
          </span>
        )}
      </div>

      {/* Affected subsystems */}
      {affectedSystems.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {affectedSystems.map((s) => (
            <Badge
              key={s.key}
              variant={s.status === "fix" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {s.status === "fix" ? <AlertTriangle className="mr-1 size-3 shrink-0" /> : null}
              {s.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Required tools / parts (top 4) */}
      {requiredTools.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Tools needed</p>
          <div className="flex flex-wrap gap-1.5">
            {requiredTools.map((tool) => (
              <Badge key={tool} variant="outline" className="text-xs font-normal">
                {tool}
              </Badge>
            ))}
            {Array.from(new Set(affectedSystems.flatMap((s) => s.tools))).length > 4 && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                +{Array.from(new Set(affectedSystems.flatMap((s) => s.tools))).length - 4} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Foreman note — shown prominently per locked decision */}
      {foremanNote && (
        <div className="mt-3 rounded-md border border-amber-300/60 bg-amber-50/70 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-900/10">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {foremanNote.foremanName}
            </span>
          </div>
          <p className="text-sm text-amber-900/90 dark:text-amber-200/90 leading-snug">
            {foremanNote.note}
          </p>
        </div>
      )}

      {/* Link to ticket — CAD viewer is inside the WO detail page */}
      <div className="mt-4">
        <Link
          to="/work-orders/$id"
          params={{ id: wo.id }}
          className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary hover:underline"
        >
          Open ticket &rarr;
        </Link>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDue(etaIso: string): string {
  const eta = new Date(etaIso);
  const now = new Date();
  const diffMs = eta.getTime() - now.getTime();
  const diffH = diffMs / 3_600_000;

  if (diffH < 0) return "Overdue";
  if (diffH < 1) return `${Math.ceil(diffH * 60)}m`;
  if (diffH < 24) return `${Math.round(diffH)}h`;
  const days = Math.ceil(diffH / 24);
  return `${days}d`;
}
