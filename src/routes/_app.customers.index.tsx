import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";
import { ContactButton } from "@/components/contact-button";

export const Route = createFileRoute("/_app/customers/")({
  component: CustomersList,
});

function CustomersList() {
  const svc = getDataService();
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => svc.getCustomers() });
  return (
    <PageShell title="Customers" description={`${customers.length} active customers`}>
      <div className="overflow-hidden rounded-2xl glass-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Vehicles</th>
              <th className="px-3 py-2 font-medium">Since</th>
              <th className="px-3 py-2 font-medium">Contact</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 text-muted-foreground tabular-nums">{c.phone}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.email}</td>
                <td className="px-3 py-2 tabular-nums">{c.vehicleIds.length}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(c.since).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <ContactButton
                    customerId={c.id}
                    label="Message"
                    variant="ghost"
                    size="sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
