import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";

export const Route = createFileRoute("/_app/tech/")({
  component: TechHome,
});

function TechHome() {
  const svc = getDataService();
  const { data: luis } = useQuery({ queryKey: ["tech", "t_luis"], queryFn: () => svc.getTechnicianById("t_luis") });
  const { data: wos = [] } = useQuery({ queryKey: ["wos", "t_luis"], queryFn: () => svc.getWorkOrdersByTech("t_luis") });

  return (
    <PageShell title="My bay" description={luis ? `${luis.name} · ${luis.specialty}` : ""}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Assigned to me" value={String(wos.length)} />
        <Stat label="Done this week" value={String(luis?.weeklyCompleted ?? 0)} />
        <Stat label="Clocked in" value={luis?.clockedIn ? "Yes" : "No"} />
        <Stat label="Top priority" value={wos.find((w) => w.urgency === "high")?.number ?? "—"} sub="dramatic Civic ticket" />
      </div>
    </PageShell>
  );
}