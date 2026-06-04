import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/invoices/")({
  component: InvoicesList,
});

function InvoicesList() {
  const svc = getDataService();
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: () => svc.getInvoices() });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => svc.getCustomers() });
  const cById = new Map(customers.map((c) => [c.id, c]));

  return (
    <PageShell title="Invoices" description={`${invoices.length} on file`}>
      <div className="overflow-hidden rounded-2xl glass-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-3 py-2 font-medium">#</th><th className="px-3 py-2 font-medium">Customer</th><th className="px-3 py-2 font-medium">Issued</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 text-right font-medium">Total</th></tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{i.number}</td>
                <td className="px-3 py-2 text-muted-foreground">{cById.get(i.customerId)?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(i.issuedIso).toLocaleDateString()}</td>
                <td className="px-3 py-2"><Badge variant={i.status === "overdue" ? "destructive" : "secondary"} className="capitalize">{i.status}</Badge></td>
                <td className="px-3 py-2 text-right tabular-nums">${i.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
