import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";

export const Route = createFileRoute("/_app/portal/")({
  component: CustomerHome,
});

function CustomerHome() {
  const svc = getDataService();
  const { data: maria } = useQuery({ queryKey: ["c", "c_maria"], queryFn: () => svc.getCustomerById("c_maria") });
  const { data: vehicles = [] } = useQuery({ queryKey: ["v", "c_maria"], queryFn: () => svc.getVehiclesByCustomer("c_maria") });
  const { data: wos = [] } = useQuery({ queryKey: ["wos", "c_maria"], queryFn: () => svc.getWorkOrdersByCustomer("c_maria") });

  const active = wos.find((w) => w.status === "in_progress");
  return (
    <PageShell title={`Hi ${maria?.name.split(" ")[0] ?? ""}`} description="Your garage at Hialeah Auto Works">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Vehicles" value={String(vehicles.length)} />
        <Stat label="Active service" value={active?.number ?? "None"} sub={active?.title} />
        <Stat label="Customer since" value={maria ? new Date(maria.since).getFullYear().toString() : "—"} />
      </div>
      {active && (
        <Link
          to="/work-orders/$id"
          params={{ id: active.id }}
          className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          See current ticket
        </Link>
      )}
    </PageShell>
  );
}