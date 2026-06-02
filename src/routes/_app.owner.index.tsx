import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";

export const Route = createFileRoute("/_app/owner/")({
  component: OwnerHome,
});

function OwnerHome() {
  const svc = getDataService();
  const { data: wos = [] } = useQuery({ queryKey: ["wos"], queryFn: () => svc.getWorkOrders() });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: () => svc.getInvoices() });
  const { data: techs = [] } = useQuery({ queryKey: ["techs"], queryFn: () => svc.getTechnicians() });

  const open = wos.filter((w) => w.status !== "completed" && w.status !== "invoiced");
  const revenue = invoices.reduce((s, i) => s + i.total, 0);

  return (
    <PageShell title="Overview" description="Hialeah Auto Works · Owner view">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open tickets" value={String(open.length)} sub="across all bays" />
        <Stat label="Active techs" value={String(techs.filter((t) => t.clockedIn).length)} sub={`of ${techs.length} on roster`} />
        <Stat label="Invoiced (lifetime demo)" value={`$${revenue.toFixed(2)}`} />
        <Stat label="High-urgency now" value={String(wos.filter((w) => w.urgency === "high" && w.status !== "completed" && w.status !== "invoiced").length)} sub="ai-flagged" />
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Detailed owner dashboards land in the next phase. Use the role switcher
        in the top bar to jump views.
      </p>
    </PageShell>
  );
}