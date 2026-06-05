import { Fragment, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ClipboardList } from "lucide-react";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";
import { UrgencyBadge } from "@/components/urgency-badge";
import { StatusChip } from "@/components/status-chip";
import { ConcernIntakePanel } from "@/components/concern-intake-panel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/service-advisor/")({
  component: ServiceAdvisorHome,
});

function ServiceAdvisorHome() {
  const svc = getDataService();

  const { data: wos = [] } = useQuery({
    queryKey: ["wos"],
    queryFn: () => svc.getWorkOrders(),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => svc.getCustomers(),
  });
  const { data: techs = [] } = useQuery({
    queryKey: ["techs"],
    queryFn: () => svc.getTechnicians(),
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => svc.getVehicles(),
  });
  const { data: concerns = [] } = useQuery({
    queryKey: ["new-concerns"],
    queryFn: () => svc.getNewConcerns(),
  });

  const cById = new Map(customers.map((c) => [c.id, c]));
  const tById = new Map(techs.map((t) => [t.id, t]));
  const vById = new Map(vehicles.map((v) => [v.id, v]));

  const QUEUE = new Set(["new", "scheduled", "in_progress", "awaiting_parts"]);
  const queue = wos.filter((w) => QUEUE.has(w.status));

  const newConcerns = concerns.filter((c) => c.status === "new" || c.status === "reviewed");
  const draftedConcerns = concerns.filter((c) => c.status === "drafted");

  const [expandedWo, setExpandedWo] = useState<string | null>(null);
  const [expandedConcern, setExpandedConcern] = useState<string | null>(null);
  const [showDrafted, setShowDrafted] = useState(false);

  const unassignedCount = queue.filter((w) => !w.technicianId).length;
  const highUrgencyCount = queue.filter((w) => w.urgency === "high").length;

  return (
    <PageShell
      title="Service advisor"
      description="Carlos Vega · New concerns and check-in queue"
    >
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="New concerns" value={String(newConcerns.length)} />
        <Stat label="Active jobs today" value={String(queue.length)} />
        <Stat label="Unassigned" value={String(unassignedCount)} />
        <Stat label="High urgency" value={String(highUrgencyCount)} />
      </div>

      {/* ── New Concerns section ────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">New concerns</h2>
          {newConcerns.length > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
              {newConcerns.length}
            </span>
          )}
        </div>

        {newConcerns.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No new concerns right now. All caught up.
          </div>
        ) : (
          <div className="space-y-3">
            {newConcerns.map((concern) => {
              const customer = cById.get(concern.customerId);
              const vehicle = vById.get(concern.vehicleId);
              const isOpen = expandedConcern === concern.id;
              const vehicleLabel = vehicle
                ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                : concern.vehicleId;

              return (
                <div key={concern.id} className="overflow-hidden rounded-xl border bg-card">
                  {/* Collapsed header */}
                  <button
                    type="button"
                    onClick={() => setExpandedConcern(isOpen ? null : concern.id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <UrgencyBadge urgency={concern.urgency} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {customer?.name ?? "Unknown customer"} — {vehicleLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {concern.complaint}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-primary font-medium">
                      {isOpen ? "Close" : "Review"}
                    </span>
                  </button>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className="border-t px-4 pb-4 pt-3">
                      <ConcernIntakePanel
                        concern={concern}
                        customerName={customer?.name ?? "Unknown customer"}
                        vehicleLabel={vehicleLabel}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Drafted concerns toggle */}
        {draftedConcerns.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDrafted((p) => !p)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              {showDrafted ? "Hide" : "Show"} {draftedConcerns.length} sent to foreman
            </button>
            {showDrafted && (
              <div className="mt-2 space-y-2">
                {draftedConcerns.map((concern) => {
                  const customer = cById.get(concern.customerId);
                  const vehicle = vById.get(concern.vehicleId);
                  const vehicleLabel = vehicle
                    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                    : concern.vehicleId;
                  const isOpen = expandedConcern === `drafted_${concern.id}`;

                  return (
                    <div key={concern.id} className="overflow-hidden rounded-xl border bg-card/60">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedConcern(isOpen ? null : `drafted_${concern.id}`)
                        }
                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                      >
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                          Sent to foreman
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {customer?.name ?? "Unknown"} — {vehicleLabel}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {concern.complaint}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {isOpen ? "Close" : "View"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t px-4 pb-4 pt-3">
                          <ConcernIntakePanel
                            concern={concern}
                            customerName={customer?.name ?? "Unknown customer"}
                            vehicleLabel={vehicleLabel}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Check-in queue section ──────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Check-in queue</h2>
          <span className="text-xs text-muted-foreground">({queue.length} active jobs)</span>
        </div>

        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active jobs for today.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl glass-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Vehicle
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium hidden sm:table-cell">
                    Phone
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Tech
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Urgency
                  </th>
                </tr>
              </thead>
              <tbody>
                {queue.map((w) => {
                  const c = cById.get(w.customerId);
                  const t = w.technicianId ? tById.get(w.technicianId) : null;
                  const v = vById.get(w.vehicleId);
                  const unassigned = !w.technicianId;
                  return (
                    <Fragment key={w.id}>
                      <tr
                        className={cn(
                          "border-b last:border-b-0 hover:bg-muted/30 min-h-[44px]",
                          unassigned && "bg-red-50 dark:bg-red-950/20",
                        )}
                      >
                        <td className="px-3 py-2">
                          <Link
                            to="/work-orders/$id"
                            params={{ id: w.id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {v ? `${v.year} ${v.make} ${v.model}` : w.number}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-sm">{c?.name ?? "—"}</td>
                        <td className="px-3 py-2 text-sm hidden sm:table-cell">
                          {c ? (
                            <a href={`tel:${c.phone}`} className="text-primary underline">
                              {c.phone}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {unassigned ? (
                            <span className="font-medium text-red-600 dark:text-red-400">
                              Unassigned
                            </span>
                          ) : (
                            t?.name ?? "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <StatusChip status={w.status} />
                        </td>
                        <td className="px-3 py-2">
                          <UrgencyBadge urgency={w.urgency} />
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </PageShell>
  );
}
