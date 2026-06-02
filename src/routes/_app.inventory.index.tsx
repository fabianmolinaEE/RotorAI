import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/inventory/")({
  component: InventoryList,
});

function InventoryList() {
  const svc = getDataService();
  const { data: items = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => svc.getInventory() });
  return (
    <PageShell title="Inventory" description={`${items.length} SKUs in stock`}>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-3 py-2 font-medium">SKU</th><th className="px-3 py-2 font-medium">Item</th><th className="px-3 py-2 font-medium">Bin</th><th className="px-3 py-2 text-right font-medium">Qty</th><th className="px-3 py-2 text-right font-medium">Cost</th></tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const low = i.qtyOnHand <= i.reorderAt;
              return (
                <tr key={i.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{i.sku}</td>
                  <td className="px-3 py-2">{i.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{i.binLocation}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{i.qtyOnHand} {low && <Badge variant="destructive" className="ml-1">low</Badge>}</td>
                  <td className="px-3 py-2 text-right tabular-nums">${i.unitCost.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}