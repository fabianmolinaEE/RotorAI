import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/work-orders/$id")({
  component: WorkOrderDetail,
});

function WorkOrderDetail() {
  const { id } = Route.useParams();
  const svc = getDataService();
  const { data: wo } = useQuery({ queryKey: ["wo", id], queryFn: () => svc.getWorkOrderById(id) });
  const { data: vehicle } = useQuery({ queryKey: ["v", wo?.vehicleId], queryFn: () => (wo ? svc.getVehicleById(wo.vehicleId) : Promise.resolve(null)), enabled: !!wo });
  const { data: customer } = useQuery({ queryKey: ["c", wo?.customerId], queryFn: () => (wo ? svc.getCustomerById(wo.customerId) : Promise.resolve(null)), enabled: !!wo });

  if (!wo) {
    return (
      <PageShell title="Work order" description="Loading…">
        <Link to="/work-orders" className="text-sm text-primary hover:underline">← Back</Link>
      </PageShell>
    );
  }

  const affected = wo.subsystems.filter((s) => s.status !== "ok");
  return (
    <PageShell
      title={wo.number}
      description={`${vehicle?.year} ${vehicle?.make} ${vehicle?.model} · ${customer?.name}`}
      actions={
        <>
          <Badge variant={wo.urgency === "high" ? "destructive" : "outline"} className="capitalize">AI urgency: {wo.aiUrgency}</Badge>
          <Badge variant="secondary" className="capitalize">{wo.status.replace("_", " ")}</Badge>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Quote" value={`$${wo.quoteAmount.toFixed(2)}`} sub={`${wo.laborHours} hr labor · $${wo.partsCost.toFixed(2)} parts`} />
        <Stat label="Quote score" value={`${wo.quoteScore}/100`} sub="reasonableness" />
        <Stat label="ETA" value={new Date(wo.etaIso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} />
        <Stat label="Affected systems" value={String(affected.length)} sub={`of ${wo.subsystems.length}`} />
      </div>
      <div className="mt-6 rounded-md border bg-card p-5">
        <h2 className="text-sm font-semibold tracking-tight">Complaint</h2>
        <p className="mt-1 text-sm text-muted-foreground">{wo.complaint}</p>
      </div>
      {affected.length > 0 && (
        <div className="mt-6 space-y-3">
          {affected.map((s) => (
            <div key={s.key} className="rounded-md border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{s.label}</div>
                <Badge variant={s.status === "fix" ? "destructive" : "outline"} className="uppercase">{s.status}</Badge>
              </div>
              {s.procedure && <p className="mt-2 text-sm text-muted-foreground">{s.procedure}</p>}
              {s.tools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.tools.map((t) => (
                    <span key={t} className="rounded-sm border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
              {s.timeEstimateMin > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">Est. {s.timeEstimateMin} min</div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Phase 2 wires the interactive 3D vehicle viewer here.
      </p>
    </PageShell>
  );
}