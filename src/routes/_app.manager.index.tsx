import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";

export const Route = createFileRoute("/_app/manager/")({
  component: ManagerHome,
});

function ManagerHome() {
  const svc = getDataService();
  const { data: wos = [] } = useQuery({ queryKey: ["wos"], queryFn: () => svc.getWorkOrders() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => svc.getTasks() });

  const today = wos.filter((w) => w.status === "in_progress" || w.status === "scheduled");
  return (
    <PageShell title="Today" description="Sandra Pratt · Service manager">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Scheduled today" value={String(today.length)} />
        <Stat label="Awaiting parts" value={String(wos.filter((w) => w.status === "awaiting_parts").length)} />
        <Stat label="New intakes" value={String(wos.filter((w) => w.status === "new").length)} />
        <Stat label="Open tasks" value={String(tasks.filter((t) => !t.done).length)} />
      </div>
    </PageShell>
  );
}