import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";
import { VehicleViewer } from "@/components/vehicle-viewer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusChip } from "@/components/status-chip";
import { useNotes } from "@/components/note-context";
import type { Vehicle, WorkOrder, Technician } from "@/data/types";

export const Route = createFileRoute("/_app/portal/")({
  component: CustomerHome,
});

function CustomerHome() {
  const svc = getDataService();
  const { data: maria } = useQuery({ queryKey: ["c", "c_maria"], queryFn: () => svc.getCustomerById("c_maria") });
  const { data: vehicles = [] } = useQuery({ queryKey: ["v", "c_maria"], queryFn: () => svc.getVehiclesByCustomer("c_maria") });
  const { data: wos = [] } = useQuery({ queryKey: ["wos", "c_maria"], queryFn: () => svc.getWorkOrdersByCustomer("c_maria") });
  const { data: techs = [] } = useQuery({ queryKey: ["techs"], queryFn: () => svc.getTechnicians() });
  const { data: shop } = useQuery({ queryKey: ["shop"], queryFn: () => svc.getShop() });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const handleToggle = (vehicleId: string) => setExpandedId((prev) => (prev === vehicleId ? null : vehicleId));

  return (
    <PageShell title="Your garage" description={maria ? `${maria.name} · ${vehicles.length} vehicles` : ""}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {vehicles.map((v) => {
          const expanded = expandedId === v.id;
          const vehicleWos = wos.filter((w) => w.vehicleId === v.id);
          return (
            <div key={v.id} className={expanded ? "sm:col-span-2" : ""}>
              <div className="rounded-2xl glass-card">
                <div
                  role="img"
                  aria-label={`${v.year} ${v.make} ${v.model} subsystem diagram`}
                  className="h-40 overflow-hidden rounded-t-2xl bg-muted"
                >
                  <VehicleViewer
                    subsystems={vehicleWos[0]?.subsystems ?? []}
                    mode="mini"
                    className="h-full w-full"
                  />
                </div>
                <div className="p-4">
                  <div className="text-sm font-semibold">
                    {v.year} {v.make} {v.model}
                    {v.trim ? ` ${v.trim}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {v.mileage.toLocaleString()} mi · {v.plate}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(v.id)}
                    className="mt-3 inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-muted"
                  >
                    {expanded ? "Hide details" : "View details"}
                  </button>
                </div>
                {expanded && (
                  <VehicleExpansion
                    vehicle={v}
                    wos={vehicleWos}
                    techs={techs}
                    shopName={shop?.name ?? "Hialeah Auto Works"}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

function VehicleExpansion({
  vehicle,
  wos,
  techs,
  shopName,
}: {
  vehicle: Vehicle;
  wos: WorkOrder[];
  techs: Technician[];
  shopName: string;
}) {
  const { notes } = useNotes();
  const tById = new Map(techs.map((t) => [t.id, t]));

  const ACTIVE = new Set(["new", "scheduled", "in_progress", "awaiting_parts"]);
  const active = wos.filter((w) => ACTIVE.has(w.status));
  const past = wos.filter((w) => w.status === "completed" || w.status === "invoiced");

  return (
    <div className="border-t p-4">
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Work</TabsTrigger>
          <TabsTrigger value="past">Past Work</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active service right now.</p>
          ) : (
            <div className="space-y-4">
              {active.map((wo) => {
                const d = new Date(wo.etaIso);
                const etaLabel = isNaN(d.getTime())
                  ? "—"
                  : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
                const techName = wo.technicianId
                  ? (tById.get(wo.technicianId)?.name ?? "—")
                  : "Unassigned";

                return (
                  <div key={wo.id} className="rounded-xl glass-card p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <StatusChip status={wo.status} />
                      <span className="text-sm font-medium">{wo.title}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Shop</div>
                        <div className="text-sm font-medium">{shopName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">ETA</div>
                        <div className="text-sm font-medium">{etaLabel}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Technician</div>
                        <div className="text-sm font-medium">{techName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Quote</div>
                        <div className="text-sm font-medium">${wo.quoteAmount.toFixed(2)}</div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">Reasonableness score</div>
                        <div className="text-xs font-medium">{wo.quoteScore}/100</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${wo.quoteScore}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Technician note</div>
                      {notes[wo.id] ? (
                        <p className="text-sm">{notes[wo.id]}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No note from your technician yet.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past service records.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Title</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Shop</th>
                  <th className="pb-2 font-medium text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {past.map((wo) => {
                  const d = new Date(wo.updatedAtIso);
                  const dateLabel = isNaN(d.getTime())
                    ? "—"
                    : d.toLocaleString(undefined, { dateStyle: "medium" });
                  return (
                    <tr key={wo.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">{dateLabel}</td>
                      <td className="py-2 pr-4">{wo.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{shopName}</td>
                      <td className="py-2">
                        <a href="#" className="text-primary hover:underline">
                          View receipt
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TabsContent>

        <TabsContent value="diagnostics" className="mt-4">
          <div className="space-y-3">
            <div className="rounded-xl glass-card p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mileage</span>
                <span className="text-sm font-medium">{vehicle.mileage.toLocaleString()} mi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Title status</span>
                <span className="text-sm font-medium">Clean title</span>
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Wear items
              </div>
              <ul className="space-y-1">
                {["Brake pads — service now", "Tires — ~60% life", "Battery — healthy"].map(
                  (item) => (
                    <li key={item} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
