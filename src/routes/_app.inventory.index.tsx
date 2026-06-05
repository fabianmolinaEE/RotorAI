import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InventoryCategoryThreshold, InventoryItem, InventoryQuantityStatus } from "@/data/types";

export const Route = createFileRoute("/_app/inventory/")({
  component: InventoryList,
});

// ─── Quantity status helpers ──────────────────────────────────────────────────
function resolveThreshold(
  item: InventoryItem,
  thresholds: InventoryCategoryThreshold[],
): InventoryCategoryThreshold {
  return (
    thresholds.find((t) => t.category === item.category) ??
    thresholds.find((t) => t.category === "__global__") ?? {
      category: "__global__",
      lowAt: 5,
      highAt: 20,
    }
  );
}

function getQtyStatus(item: InventoryItem, thresholds: InventoryCategoryThreshold[]): InventoryQuantityStatus {
  const t = resolveThreshold(item, thresholds);
  if (item.qtyOnHand <= t.lowAt) return "low";
  if (item.qtyOnHand >= t.highAt) return "high";
  return "healthy";
}

const QTY_BADGE: Record<InventoryQuantityStatus, { label: string; className: string }> = {
  low: {
    label: "Low quantity",
    className: "bg-destructive/15 text-destructive border-destructive/20",
  },
  healthy: {
    label: "Healthy quantity",
    className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20",
  },
  high: {
    label: "High quantity",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
};

// ─── Filter types ────────────────────────────────────────────────────────────
type QtyFilter = "all" | "low" | "healthy" | "high" | "frequent";

const QTY_FILTER_LABELS: Record<QtyFilter, string> = {
  all: "All",
  low: "Low",
  healthy: "Healthy",
  high: "High",
  frequent: "Frequently used",
};

// ─── Sort logic ───────────────────────────────────────────────────────────────
function sortItems(
  items: InventoryItem[],
  thresholds: InventoryCategoryThreshold[],
): InventoryItem[] {
  // Priority: low-qty first, then frequent, then healthy, then high
  const priority = (item: InventoryItem): number => {
    const qs = getQtyStatus(item, thresholds);
    if (qs === "low") return 0;
    if (item.usageRank >= 70) return 1;
    if (qs === "healthy") return 2;
    return 3;
  };

  return [...items].sort((a, b) => {
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    // Secondary: descending usageRank
    return b.usageRank - a.usageRank;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
function InventoryList() {
  const svc = getDataService();
  const { data: items = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => svc.getInventory(),
  });
  const { data: thresholds = [] } = useQuery({
    queryKey: ["inventory-thresholds"],
    queryFn: () => svc.getInventoryCategoryThresholds(),
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [qtyFilter, setQtyFilter] = useState<QtyFilter>("all");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map((i) => i.category))).sort();
    return ["all", ...cats];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = items.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q) && !item.sku.toLowerCase().includes(q)) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (qtyFilter !== "all") {
        if (qtyFilter === "frequent") {
          if (item.usageRank < 70) return false;
        } else {
          const qs = getQtyStatus(item, thresholds);
          if (qs !== qtyFilter) return false;
        }
      }
      return true;
    });
    return sortItems(base, thresholds);
  }, [items, thresholds, search, categoryFilter, qtyFilter]);

  const lowCount = useMemo(
    () => items.filter((i) => getQtyStatus(i, thresholds) === "low").length,
    [items, thresholds],
  );

  return (
    <PageShell
      title="Inventory"
      description={`${items.length} SKUs in stock${lowCount > 0 ? ` · ${lowCount} low` : ""}`}
    >
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or SKU…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === "all" ? "All categories" : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Quantity status filter pills */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(QTY_FILTER_LABELS) as QtyFilter[]).map((f) => (
          <Button
            key={f}
            variant={qtyFilter === f ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setQtyFilter(f)}
          >
            {QTY_FILTER_LABELS[f]}
            {f === "low" && lowCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 px-1 py-0 text-[10px]">
                {lowCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl glass-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Bin</th>
              <th className="px-3 py-2 text-right font-medium">Qty</th>
              <th className="px-3 py-2 text-right font-medium">Cost</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No items match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const qs = getQtyStatus(item, thresholds);
                const qtyCfg = QTY_BADGE[qs];
                const isFrequent = item.usageRank >= 70;

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b last:border-b-0 hover:bg-muted/30",
                      qs === "low" && "bg-destructive/5",
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {item.sku}
                    </td>
                    <td className="px-3 py-2">
                      <span>{item.name}</span>
                      {isFrequent && (
                        <span className="ml-2 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                          Frequently used
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{item.category}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.binLocation}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {item.qtyOnHand}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          qtyCfg.className,
                        )}
                      >
                        {qtyCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="mt-2 text-right text-xs text-muted-foreground">
          Showing {filtered.length} of {items.length} items — sorted by scarcity, then usage
        </p>
      )}
    </PageShell>
  );
}
