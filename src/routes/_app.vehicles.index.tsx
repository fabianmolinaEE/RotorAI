import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/_app/vehicles/")({
  component: VehiclesList,
});

function VehiclesList() {
  const svc = getDataService();
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => svc.getVehicles() });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => svc.getCustomers() });
  const cById = new Map(customers.map((c) => [c.id, c]));

  return (
    <PageShell title="Vehicles" description={`${vehicles.length} in customer fleet`}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => (
          <div key={v.id} className="rounded-md border bg-card p-4">
            <div className="text-sm font-semibold">{v.year} {v.make} {v.model} {v.trim}</div>
            <div className="mt-1 text-xs text-muted-foreground">VIN {v.vin}</div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{cById.get(v.customerId)?.name}</span>
              <span className="tabular-nums">{v.mileage.toLocaleString()} mi</span>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}