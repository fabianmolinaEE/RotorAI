import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";
import { UrgencyBadge } from "@/components/urgency-badge";
import { StatusChip } from "@/components/status-chip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Drawer, DrawerClose, DrawerPortal, DrawerOverlay } from "@/components/ui/drawer";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Technician, WorkOrder, Vehicle } from "@/data/types";

export const Route = createFileRoute("/_app/manager/")({
  component: ManagerHome,
});

const WORKING = new Set(["in_progress", "awaiting_parts"]);
const PENDING = new Set(["new", "scheduled"]);
const CLOSED = new Set(["completed", "invoiced"]);

interface WoTableProps {
  rows: WorkOrder[];
  vById: Map<string, Vehicle>;
  tById: Map<string, Technician>;
  emptyMessage: string;
}

function WoTable({ rows, vById, tById, emptyMessage }: WoTableProps) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">WO #</th>
            <th className="px-3 py-2 font-medium">Vehicle</th>
            <th className="px-3 py-2 font-medium">Urgency</th>
            <th className="px-3 py-2 font-medium">Tech</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((w) => {
            const v = vById.get(w.vehicleId);
            const updatedDate = new Date(w.updatedAtIso);
            const updatedStr = isNaN(updatedDate.getTime()) ? "—" : updatedDate.toLocaleDateString();
            return (
              <tr key={w.id} className="border-b last:border-b-0 hover:bg-muted/30 min-h-[44px]">
                <td className="px-3 py-2">
                  <Link
                    to="/work-orders/$id"
                    params={{ id: w.id }}
                    className="font-medium text-primary hover:underline"
                  >
                    {w.number}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {v ? `${v.year} ${v.make} ${v.model}` : "—"}
                </td>
                <td className="px-3 py-2">
                  <UrgencyBadge urgency={w.urgency} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {w.technicianId ? (tById.get(w.technicianId)?.name ?? "—") : "Unassigned"}
                </td>
                <td className="px-3 py-2">
                  <StatusChip status={w.status} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">{updatedStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ManagerHome() {
  const svc = getDataService();
  const { data: wos = [] } = useQuery({ queryKey: ["wos"], queryFn: () => svc.getWorkOrders() });
  const { data: techs = [] } = useQuery({ queryKey: ["techs"], queryFn: () => svc.getTechnicians() });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => svc.getVehicles() });

  const vById = new Map(vehicles.map((v) => [v.id, v]));
  const tById = new Map(techs.map((t) => [t.id, t]));

  const working = wos.filter((w) => WORKING.has(w.status));
  const pending = wos.filter((w) => PENDING.has(w.status));
  const closed = wos.filter((w) => CLOSED.has(w.status));

  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);

  return (
    <PageShell title="Floor view" description="Sandra Pratt · Foreman">
      <Tabs defaultValue="working">
        <TabsList>
          <TabsTrigger value="working">Working ({working.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="working" className="mt-4">
          <WoTable
            rows={working}
            vById={vById}
            tById={tById}
            emptyMessage="No active jobs right now. All clear."
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <WoTable
            rows={pending}
            vById={vById}
            tById={tById}
            emptyMessage="No pending jobs in queue."
          />
        </TabsContent>
        <TabsContent value="closed" className="mt-4">
          <WoTable
            rows={closed}
            vById={vById}
            tById={tById}
            emptyMessage="No closed jobs this period."
          />
        </TabsContent>
      </Tabs>

      <h2 className="mt-12 text-lg font-semibold">Team roster</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {techs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedTech(t)}
            className="rounded-md border bg-card p-4 text-left hover:bg-accent hover:text-accent-foreground min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <span
                aria-label={t.clockedIn ? "Clocked in" : "Clocked out"}
                className={
                  t.clockedIn
                    ? "h-2.5 w-2.5 rounded-full bg-green-500"
                    : "h-2.5 w-2.5 rounded-full bg-muted-foreground/40"
                }
              />
              <span className="text-sm font-semibold">{t.name}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{t.specialty}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              {t.activeWorkOrderIds.length} active · {t.weeklyCompleted} done this week
            </div>
          </button>
        ))}
      </div>

      <Drawer
        open={selectedTech !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedTech(null);
        }}
        direction="right"
        shouldScaleBackground={false}
      >
        <DrawerPortal>
          <DrawerOverlay className="bg-black/60" onClick={() => setSelectedTech(null)} />
          <DrawerPrimitive.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex h-[80vh] max-h-[80vh] flex-col rounded-t-[10px] border bg-card",
              "sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-full sm:w-[40vw] sm:min-w-[320px] sm:max-w-[480px] sm:rounded-none",
            )}
          >
            <div className="flex items-start justify-between gap-3 border-b p-5">
              <DrawerPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                {selectedTech?.name}
              </DrawerPrimitive.Title>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {selectedTech &&
                (() => {
                  const techWos = wos.filter((w) => selectedTech.activeWorkOrderIds.includes(w.id));
                  return techWos.length > 0 ? (
                    <>
                      {techWos.map((w) => {
                        const v = vById.get(w.vehicleId);
                        return (
                          <div key={w.id} className="mb-3 rounded-md border bg-card p-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold">{w.number}</span>
                              <StatusChip status={w.status} />
                            </div>
                            <div className="mt-1 text-sm">{w.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {v ? `${v.year} ${v.make} ${v.model}` : "—"}
                            </div>
                            <div className="mt-2">
                              <UrgencyBadge urgency={w.urgency} />
                            </div>
                          </div>
                        );
                      })}
                      <div className="mt-4 rounded-md border bg-card p-4 text-sm">
                        Weekly completed:{" "}
                        <span className="font-semibold">{selectedTech.weeklyCompleted}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active tickets.</p>
                  );
                })()}
            </div>
            <div className="mt-auto flex justify-end border-t p-4">
              <DrawerClose asChild>
                <Button variant="outline" size="sm">
                  Close
                </Button>
              </DrawerClose>
            </div>
          </DrawerPrimitive.Content>
        </DrawerPortal>
      </Drawer>
    </PageShell>
  );
}
