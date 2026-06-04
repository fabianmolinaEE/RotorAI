import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";
import { TicketCard } from "@/components/ticket-card";

export const Route = createFileRoute("/_app/tech/")({
  component: TechHome,
});

function TechHome() {
  const svc = getDataService();
  const { data: luis } = useQuery({ queryKey: ["tech", "t_luis"], queryFn: () => svc.getTechnicianById("t_luis") });
  const { data: wos = [] } = useQuery({ queryKey: ["wos", "t_luis"], queryFn: () => svc.getWorkOrdersByTech("t_luis") });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => svc.getVehicles() });

  const vById = new Map(vehicles.map((v) => [v.id, v]));

  const urgencyOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
  const sorted = [...wos].sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return (
    <PageShell title="My bay" description={luis ? `${luis.name} · ${luis.specialty}` : ""}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Assigned" value={String(wos.length)} />
        <Stat label="Done this week" value={String(luis?.weeklyCompleted ?? 0)} />
        <Stat label="Clocked in" value={luis?.clockedIn ? "Yes" : "No"} />
        <Stat label="Open tickets" value={String(sorted.filter((w) => w.status !== "completed" && w.status !== "invoiced").length)} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((wo) => {
          const v = vById.get(wo.vehicleId);
          const name = v ? `${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}` : undefined;
          return <TicketCard key={wo.id} wo={wo} vehicleName={name} />;
        })}
      </div>
    </PageShell>
  );
}
