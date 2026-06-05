import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell } from "@/components/page-shell";
import { VehicleViewer } from "@/components/vehicle-viewer";
import { QuoteBreakdownCard } from "@/components/quote-breakdown-card";
import { CustomerRecommendations } from "@/components/customer-recommendations";
import { ServiceHistory } from "@/components/service-history";
import { ContactButton } from "@/components/contact-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusChip } from "@/components/status-chip";
import { useNotes } from "@/components/note-context";
import type { CustomerRecommendation, ServiceHistoryRecord, Technician, Vehicle, WorkOrder } from "@/data/types";

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
  const { data: history = [] } = useQuery({ queryKey: ["serviceHistory", "c_maria"], queryFn: () => svc.getServiceHistoryByCustomer("c_maria") });
  const { data: recommendations = [] } = useQuery({ queryKey: ["recommendations", "c_maria"], queryFn: () => svc.getCustomerRecommendations("c_maria") });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [vehicleTabs, setVehicleTabs] = useState<Record<string, string>>({});
  const handleToggle = (vehicleId: string) => setExpandedId((prev) => (prev === vehicleId ? null : vehicleId));

  return (
    <PageShell
      title="Your garage"
      description={maria ? `${maria.name} · ${vehicles.length} vehicles` : ""}
      actions={
        <ContactButton
          customerId="c_maria"
          label="Message shop"
          variant="outline"
          size="md"
        />
      }
    >
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
                    serviceHistory={history.filter((record) => record.vehicleId === v.id)}
                    recommendations={recommendations.filter((rec) => rec.vehicleId === v.id)}
                    activeTab={vehicleTabs[v.id] ?? "active"}
                    onTabChange={(tab) => setVehicleTabs((prev) => ({ ...prev, [v.id]: tab }))}
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
  serviceHistory,
  recommendations,
  activeTab,
  onTabChange,
}: {
  vehicle: Vehicle;
  wos: WorkOrder[];
  techs: Technician[];
  shopName: string;
  serviceHistory: ServiceHistoryRecord[];
  recommendations: CustomerRecommendation[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const { notes } = useNotes();
  const tById = new Map(techs.map((t) => [t.id, t]));

  const ACTIVE = new Set(["new", "scheduled", "in_progress", "awaiting_parts"]);
  const active = wos.filter((w) => ACTIVE.has(w.status));

  return (
    <div className="border-t p-4">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="active">Active Work</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
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
                        <div className="text-sm font-medium">${wo.quoteBreakdown.total.toFixed(2)}</div>
                      </div>
                    </div>

                    <QuoteBreakdownCard quote={wo.quoteBreakdown} variant="customer" />

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

        <TabsContent value="recommendations" className="mt-4">
          <CustomerRecommendations recommendations={recommendations} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ServiceHistory records={serviceHistory} />
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

        <TabsContent value="chat" className="mt-4">
          <div id="customer-chat" className="rounded-xl glass-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-500/20 bg-sky-500/12 text-sky-600 dark:text-sky-300">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              <div>
                <div className="text-sm font-semibold">Message Hialeah Auto Works</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask about active work, request a detailed quote, or follow up on recommendations.
                </p>
                <ContactButton
                  customerId="c_maria"
                  label="Open messages"
                  variant="default"
                  size="md"
                  className="mt-3"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
