import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";
import { UrgencyBadge } from "@/components/urgency-badge";
import { PlaceholderSubpage } from "@/components/placeholder-subpage";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Invoice, WorkOrder } from "@/data/types";

export const Route = createFileRoute("/_app/owner/")({
  component: OwnerHome,
});

type Section =
  | "overview"
  | "work-orders"
  | "finance"
  | "inventory"
  | "tasks"
  | "leads"
  | "sales"
  | "clients"
  | "chats"
  | "calls"
  | "reports"
  | "settings";

const NAV: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "work-orders", label: "Work Orders" },
  { id: "finance", label: "Finance" },
  { id: "inventory", label: "Inventory" },
  { id: "tasks", label: "Tasks" },
  { id: "leads", label: "Leads" },
  { id: "sales", label: "Sales" },
  { id: "clients", label: "Clients" },
  { id: "chats", label: "Chats" },
  { id: "calls", label: "Calls" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

const REAL = new Set<Section>(["overview", "work-orders", "finance", "inventory"]);

function buildChartData(invs: Invoice[]) {
  const weeks = new Map<string, { revenue: number; profit: number }>();
  for (const inv of invs) {
    const d = new Date(inv.issuedIso);
    if (isNaN(d.getTime())) continue;
    const weekNum = Math.ceil(
      (d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) /
        (7 * 86400 * 1000),
    );
    const key = `W${weekNum}`;
    const cur = weeks.get(key) ?? { revenue: 0, profit: 0 };
    cur.revenue += inv.total;
    cur.profit += inv.total * 0.4;
    weeks.set(key, cur);
  }
  const entries = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([week, v]) => ({
    week,
    revenue: Math.round(v.revenue),
    profit: Math.round(v.profit),
  }));
}

const URGENCY_LEVELS = ["high", "normal", "low"] as const;

function getMismatchedAiUrgency(wos: WorkOrder[], urgency: string): string | null {
  for (const wo of wos) {
    if (wo.urgency === urgency && wo.aiUrgency && wo.aiUrgency !== urgency) {
      return wo.aiUrgency;
    }
  }
  return null;
}

function OverviewSection({
  wos,
  invoices,
  techs,
  inventory,
  leads,
}: {
  wos: WorkOrder[];
  invoices: Invoice[];
  techs: { clockedIn: boolean; weeklyCompleted: number }[];
  inventory: { unitCost: number; qtyOnHand: number }[];
  leads: unknown[];
}) {
  const chartData = buildChartData(invoices);
  const openTickets = wos.filter(
    (w) => w.status !== "completed" && w.status !== "invoiced",
  );
  const activeTechs = techs.filter((t) => t.clockedIn);
  const weeklyRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const highUrgency = wos.filter((w) => w.urgency === "high");
  const inventoryValue = inventory.reduce(
    (s, i) => s + i.unitCost * i.qtyOnHand,
    0,
  );
  const throughput = techs.reduce((s, t) => s + t.weeklyCompleted, 0);

  return (
    <div className="space-y-8">
      {/* Stat row 1 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Open tickets"
          value={String(openTickets.length)}
          sub="across all bays"
        />
        <Stat
          label="Active techs"
          value={String(activeTechs.length)}
          sub={`of ${techs.length} on roster`}
        />
        <Stat
          label="Weekly revenue"
          value={`$${weeklyRevenue.toFixed(0)}`}
          sub="from invoice data"
        />
        <Stat
          label="High urgency"
          value={String(highUrgency.length)}
          sub="ai-flagged"
        />
      </div>

      {/* Stat row 2 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat
          label="Inventory value"
          value={`$${inventoryValue.toFixed(0)}`}
          sub="parts on hand"
        />
        <Stat
          label="Active leads"
          value={String(leads.length)}
          sub="in pipeline"
        />
        <Stat
          label="Throughput"
          value={String(throughput)}
          sub="tickets closed this week"
        />
      </div>

      {/* Revenue + Profit charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-md border bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            Revenue by week
          </p>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invoice data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-md border bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            Profit by week
          </p>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invoice data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  dataKey="profit"
                  stroke="var(--chart-2)"
                  fill="url(#profitGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Urgency breakdown table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Urgency breakdown this week
        </h2>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Urgency</th>
                <th className="px-3 py-2 font-medium">Tickets</th>
                <th className="px-3 py-2 font-medium">In Progress</th>
                <th className="px-3 py-2 font-medium">Done</th>
                <th className="px-3 py-2 font-medium">AI</th>
              </tr>
            </thead>
            <tbody>
              {URGENCY_LEVELS.map((level) => {
                const atLevel = wos.filter((w) => w.urgency === level);
                const inProgress = atLevel.filter(
                  (w) =>
                    w.status === "in_progress" ||
                    w.status === "awaiting_parts",
                ).length;
                const done = atLevel.filter(
                  (w) =>
                    w.status === "completed" || w.status === "invoiced",
                ).length;
                const mismatchedAi = getMismatchedAiUrgency(wos, level);

                return (
                  <tr
                    key={level}
                    className="border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-3 py-2">
                      <UrgencyBadge urgency={level} />
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {atLevel.length}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{inProgress}</td>
                    <td className="px-3 py-2 tabular-nums">{done}</td>
                    <td className="px-3 py-2">
                      {mismatchedAi ? (
                        <span className="ring-2 ring-amber-400 rounded-md inline-flex">
                          <UrgencyBadge urgency={mismatchedAi} />
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WorkOrdersSection({ wos }: { wos: WorkOrder[] }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Work Orders</h2>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">WO #</th>
              <th className="px-3 py-2 font-medium">Vehicle</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Urgency</th>
            </tr>
          </thead>
          <tbody>
            {wos.map((wo) => (
              <tr
                key={wo.id}
                className="border-b last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2 font-medium">{wo.number}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {wo.vehicleId}
                </td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className="capitalize">
                    {wo.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <UrgencyBadge urgency={wo.urgency} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinanceSection({ invoices }: { invoices: Invoice[] }) {
  const total = invoices.reduce((s, i) => s + i.total, 0);
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Finance</h2>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Invoice #</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-b last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2 font-medium">{inv.number}</td>
                <td className="px-3 py-2">
                  <Badge
                    variant={inv.status === "overdue" ? "destructive" : "secondary"}
                    className="capitalize"
                  >
                    {inv.status}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  ${inv.total.toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="border-t bg-muted/40 font-semibold">
              <td className="px-3 py-2" colSpan={2}>
                Total
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                ${total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventorySection({
  inventory,
}: {
  inventory: { id: string; sku: string; name: string; qtyOnHand: number; unitCost: number }[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Inventory</h2>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 text-right font-medium">Qty</th>
              <th className="px-3 py-2 text-right font-medium">Unit cost</th>
              <th className="px-3 py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr
                key={item.id}
                className="border-b last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2 font-medium text-muted-foreground">
                  {item.sku}
                </td>
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {item.qtyOnHand}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  ${item.unitCost.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  ${(item.unitCost * item.qtyOnHand).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OwnerHome() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const svc = getDataService();
  const { data: wos = [] } = useQuery({
    queryKey: ["wos"],
    queryFn: () => svc.getWorkOrders(),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => svc.getInvoices(),
  });
  const { data: techs = [] } = useQuery({
    queryKey: ["techs"],
    queryFn: () => svc.getTechnicians(),
  });
  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => svc.getInventory(),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => svc.getLeads(),
  });

  return (
    <PageShell
      title="Overview"
      description="Frank Delgado · Service Manager"
    >
      {/* Secondary nav rail */}
      <div className="mb-6 flex flex-wrap gap-1 border-b pb-2">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setActiveSection(n.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              activeSection === n.id
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {activeSection === "overview" && (
        <OverviewSection
          wos={wos}
          invoices={invoices}
          techs={techs}
          inventory={inventory}
          leads={leads}
        />
      )}
      {activeSection === "work-orders" && (
        <WorkOrdersSection wos={wos} />
      )}
      {activeSection === "finance" && (
        <FinanceSection invoices={invoices} />
      )}
      {activeSection === "inventory" && (
        <InventorySection inventory={inventory} />
      )}
      {!REAL.has(activeSection) && (
        <PlaceholderSubpage
          title={NAV.find((n) => n.id === activeSection)?.label ?? "Feature"}
        />
      )}
    </PageShell>
  );
}
