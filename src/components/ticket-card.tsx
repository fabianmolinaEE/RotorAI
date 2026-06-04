// PERF NOTE (Phase 3): mode="mini" renders one WebGL canvas per card (frameloop="demand",
// freezes after one frame). Browsers cap WebGL contexts at ~16. Safe here: the Technician
// grid renders <=3 cards (Luis has 3 WOs) and the Foreman drawer <=3. If a future grid
// renders >12 TicketCards at once, switch the header to a CSS-only subsystem-dot fallback.

import { Link } from "@tanstack/react-router";
import { VehicleViewer } from "@/components/vehicle-viewer";
import { UrgencyBadge } from "@/components/urgency-badge";
import { StatusChip } from "@/components/status-chip";
import type { WorkOrder } from "@/data/types";

export function TicketCard({
  wo,
  vehicleName,
}: {
  wo: WorkOrder;
  vehicleName?: string;
}) {
  return (
    <div className="rounded-2xl glass-card glass-card-interactive overflow-hidden">
      <div
        role="img"
        aria-label={`${vehicleName ?? wo.number} subsystem diagram`}
        className="h-40 overflow-hidden rounded-t-2xl bg-muted"
      >
        <VehicleViewer
          subsystems={wo.subsystems}
          mode="mini"
          className="h-full w-full"
        />
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold">{wo.number}</p>
        <p className="text-sm">{wo.title}</p>
        <p className="text-xs text-muted-foreground">{vehicleName ?? "—"}</p>
        <div className="mt-3 flex items-center gap-2">
          <UrgencyBadge urgency={wo.urgency} />
          <StatusChip status={wo.status} />
        </div>
        <div className="mt-3">
          <Link
            to="/work-orders/$id"
            params={{ id: wo.id }}
            className="text-primary text-sm hover:underline"
          >
            View ticket &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
