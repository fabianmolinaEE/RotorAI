import { Fragment, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";
import { UrgencyBadge } from "@/components/urgency-badge";
import { StatusChip } from "@/components/status-chip";
import { useNotes } from "@/components/note-context";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/service-advisor/")({
  component: ServiceAdvisorHome,
});

function ServiceAdvisorHome() {
  const svc = getDataService();
  const { data: wos = [] } = useQuery({ queryKey: ["wos"], queryFn: () => svc.getWorkOrders() });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => svc.getCustomers() });
  const { data: techs = [] } = useQuery({ queryKey: ["techs"], queryFn: () => svc.getTechnicians() });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => svc.getVehicles() });
  const { notes } = useNotes();

  const cById = new Map(customers.map((c) => [c.id, c]));
  const tById = new Map(techs.map((t) => [t.id, t]));
  const vById = new Map(vehicles.map((v) => [v.id, v]));

  const QUEUE = new Set(["new", "scheduled", "in_progress", "awaiting_parts"]);
  const queue = wos.filter((w) => QUEUE.has(w.status));

  const [messages, setMessages] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleSave = (woId: string, text: string) =>
    setMessages((prev) => ({ ...prev, [woId]: text }));

  const unassignedCount = queue.filter((w) => !w.technicianId).length;
  const highUrgencyCount = queue.filter((w) => w.urgency === "high").length;

  return (
    <PageShell title="Check-in queue" description="Carlos Vega · Service Advisor">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Active jobs today" value={String(queue.length)} />
        <Stat label="Unassigned" value={String(unassignedCount)} />
        <Stat label="High urgency" value={String(highUrgencyCount)} />
      </div>

      {queue.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active jobs for today.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl glass-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Vehicle</th>
                <th scope="col" className="px-3 py-2 font-medium">Customer</th>
                <th scope="col" className="px-3 py-2 font-medium">Phone</th>
                <th scope="col" className="px-3 py-2 font-medium">Tech</th>
                <th scope="col" className="px-3 py-2 font-medium">Status</th>
                <th scope="col" className="px-3 py-2 font-medium">Urgency</th>
                <th scope="col" className="px-3 py-2 font-medium">Message</th>
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
                      <td className="px-3 py-2 text-sm">
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
                          <span className="font-medium text-red-600 dark:text-red-400">Unassigned</span>
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
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setExpanded((p) => (p === w.id ? null : w.id))}
                          className="text-sm text-primary hover:underline"
                        >
                          {expanded === w.id ? "Hide" : "Message"}
                        </button>
                      </td>
                    </tr>
                    {expanded === w.id && (
                      <tr className="border-b bg-muted/20">
                        <td colSpan={7} className="px-3 py-3">
                          {notes[w.id] && (
                            <p className="mb-2 text-xs text-muted-foreground">
                              Tech note:{" "}
                              <span className="text-foreground">{notes[w.id]}</span>
                            </p>
                          )}
                          <Textarea
                            rows={3}
                            className="resize-none"
                            placeholder="Type a status update for the customer..."
                            value={messages[w.id] ?? ""}
                            onChange={(e) => handleSave(w.id, e.target.value)}
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSave(w.id, messages[w.id] ?? "")}
                              className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
                            >
                              Save message
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSave(w.id, "")}
                              className="inline-flex h-8 items-center rounded-md px-3 text-sm hover:bg-muted"
                            >
                              Clear
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
