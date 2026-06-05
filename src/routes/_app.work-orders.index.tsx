import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/work-orders/")({
  component: WorkOrdersList,
});

function WorkOrdersList() {
  const svc = getDataService();
  const { data: wos = [] } = useQuery({ queryKey: ["wos"], queryFn: () => svc.getWorkOrders() });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => svc.getVehicles() });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => svc.getCustomers() });

  const vById = new Map(vehicles.map((v) => [v.id, v]));
  const cById = new Map(customers.map((c) => [c.id, c]));

  return (
    <PageShell title="Work orders" description={`${wos.length} active and recent tickets`}>
      <div className="overflow-hidden rounded-2xl glass-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Vehicle</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Urgency</th>
              <th className="px-3 py-2 text-right font-medium">Quote total</th>
            </tr>
          </thead>
          <tbody>
            {wos.map((w) => {
              const v = vById.get(w.vehicleId);
              const c = cById.get(w.customerId);
              return (
                <tr key={w.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Link to="/work-orders/$id" params={{ id: w.id }} className="font-medium text-primary hover:underline">
                      {w.number}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{v ? `${v.year} ${v.make} ${v.model}` : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c?.name ?? "—"}</td>
                  <td className="px-3 py-2">{w.title}</td>
                  <td className="px-3 py-2"><Badge variant="secondary" className="capitalize">{w.status.replace("_", " ")}</Badge></td>
                  <td className="px-3 py-2">
                    <Badge variant={w.urgency === "high" ? "destructive" : "outline"} className="capitalize">{w.urgency}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{w.quoteBreakdown.total > 0 ? `$${w.quoteBreakdown.total.toFixed(2)}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
