import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";
import { TimekeepingPanel } from "@/components/timekeeping-panel";
import { AssignedTicketQueue } from "@/components/assigned-ticket-queue";
import type { WorkOrderForemanNote } from "@/data/types";

export const Route = createFileRoute("/_app/tech/")({
  component: TechHome,
});

const TECH_ID = "t_luis";

function TechHome() {
  const svc = getDataService();

  const { data: luis } = useQuery({
    queryKey: ["tech", TECH_ID],
    queryFn: () => svc.getTechnicianById(TECH_ID),
  });

  const { data: wos = [] } = useQuery({
    queryKey: ["wos", TECH_ID],
    queryFn: () => svc.getWorkOrdersByTech(TECH_ID),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => svc.getVehicles(),
  });

  const { data: bays = [] } = useQuery({
    queryKey: ["bays"],
    queryFn: () => svc.getBays(),
  });

  const { data: allForemanNotes = [] } = useQuery({
    queryKey: ["foremanNotes"],
    queryFn: () => svc.getForemanNotes(),
  });

  const { data: activeShift } = useQuery({
    queryKey: ["activeShift", TECH_ID],
    queryFn: () => svc.getActiveShift(TECH_ID),
  });

  // Build lookup maps for the queue component
  const vehicleLabels = new Map(
    vehicles.map((v) => [v.id, `${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}`]),
  );

  // Map workOrderId → vehicle label via workOrder.vehicleId
  const woVehicleLabels = new Map(
    wos.map((wo) => [wo.id, vehicleLabels.get(wo.vehicleId) ?? ""]),
  );

  // Map workOrderId → bay label from bays array
  const bayByWorkOrder = new Map(
    bays
      .filter((b) => b.workOrderId !== null)
      .map((b) => [b.workOrderId as string, b.label]),
  );

  // Map workOrderId → foreman note
  const notesByWo = new Map<string, WorkOrderForemanNote>(
    allForemanNotes.map((n) => [n.workOrderId, n]),
  );

  const openCount = wos.filter((w) => w.status !== "completed" && w.status !== "invoiced").length;

  return (
    <PageShell
      title="My bay"
      description={luis ? `${luis.name} · ${luis.specialty}` : ""}
    >
      {/* Timekeeping panel — first thing a technician sees on landing */}
      <TimekeepingPanel
        technicianId={TECH_ID}
        bayId={activeShift?.bayId ?? null}
        className="mb-6"
      />

      {/* Assignment queue header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Assigned tickets
          {openCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {openCount} open
            </span>
          )}
        </h2>
        <span className="text-xs text-muted-foreground">
          {luis?.weeklyCompleted ?? 0} completed this week
        </span>
      </div>

      {/* Assignment-first queue — CAD viewer only after clicking into a ticket */}
      <AssignedTicketQueue
        workOrders={wos}
        foremanNotes={notesByWo}
        vehicleLabels={woVehicleLabels}
        bayLabels={bayByWorkOrder}
      />
    </PageShell>
  );
}
