import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataService } from "@/data/dataService";
import { PageShell, Stat } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { VehicleViewer } from "@/components/vehicle-viewer";
import { SubsystemDetailPanel } from "@/components/subsystem-detail-panel";
import { useRole } from "@/app/RoleContext";
import { useNotes } from "@/components/note-context";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Subsystem, SubsystemKey, SubsystemStatus, WorkOrderStatus } from "@/data/types";

export const Route = createFileRoute("/_app/work-orders/$id")({
  component: WorkOrderDetail,
});

function WorkOrderDetail() {
  const { id } = Route.useParams();
  const svc = getDataService();
  const { data: wo } = useQuery({ queryKey: ["wo", id], queryFn: () => svc.getWorkOrderById(id) });
  const { data: vehicle } = useQuery({ queryKey: ["v", wo?.vehicleId], queryFn: () => (wo ? svc.getVehicleById(wo.vehicleId) : Promise.resolve(null)), enabled: !!wo });
  const { data: customer } = useQuery({ queryKey: ["c", wo?.customerId], queryFn: () => (wo ? svc.getCustomerById(wo.customerId) : Promise.resolve(null)), enabled: !!wo });

  // Hook must always run — defined before any early return
  const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | null>(null);

  // Technician-gated hooks — all unconditional to preserve hook order
  const { role } = useRole();
  const { notes, setNote } = useNotes();
  const [clockedIn, setClockedIn] = useState(false);
  const [checkedTools, setCheckedTools] = useState<Record<string, boolean>>({});
  // TECH-04: local subsystem + ticket status overrides (never mutate DataService — D-13)
  const [subsystemStatus, setSubsystemStatus] = useState<Record<SubsystemKey, SubsystemStatus>>({} as Record<SubsystemKey, SubsystemStatus>);
  const [ticketStatus, setTicketStatus] = useState<WorkOrderStatus | null>(null);
  const { data: tools = [] } = useQuery({ queryKey: ["tools"], queryFn: () => svc.getTools(), enabled: role === "technician" });
  const { data: toolCheckouts = [] } = useQuery({ queryKey: ["toolCheckouts"], queryFn: () => svc.getToolCheckouts(), enabled: role === "technician" });
  const { data: timeEntries = [] } = useQuery({ queryKey: ["timeEntries"], queryFn: () => svc.getTimeEntries(), enabled: role === "technician" });

  if (!wo) {
    return (
      <PageShell title="Work order" description="Loading…">
        <Link to="/work-orders" className="text-sm text-primary hover:underline">← Back</Link>
      </PageShell>
    );
  }

  const handleSubsystemClick = (key: SubsystemKey) => {
    const subsystem = wo.subsystems.find((s) => s.key === key) ?? null;
    setSelectedSubsystem(subsystem);
  };

  const affected = wo.subsystems.filter((s) => s.status !== "ok");

  // Technician widget derivations (safe to place after wo is known)
  const SUBSYSTEM_STATUSES: SubsystemStatus[] = ["ok", "check", "fix"];
  const TICKET_STATUSES: WorkOrderStatus[] = ["new", "scheduled", "in_progress", "awaiting_parts", "completed", "invoiced"];
  const effTicketStatus = ticketStatus ?? wo.status;
  const subStatus = (s: { key: SubsystemKey; status: SubsystemStatus }) => subsystemStatus[s.key] ?? s.status;

  const techId = wo.technicianId;
  const myEntries = techId ? timeEntries.filter((e) => e.technicianId === techId) : [];
  const weekMinutes = myEntries.reduce((s, e) => s + e.minutes, 0);
  const todayMinutes = myEntries.filter((e) => e.endedIso === null).reduce((s, e) => s + e.minutes, 0);
  const fmtHours = (m: number) => (m / 60).toFixed(1);

  // Pre-initialize tool-checked state from seed checkouts for THIS work order
  const checkedOutToolIds = new Set(toolCheckouts.filter((c) => c.workOrderId === wo.id).map((c) => c.toolId));

  return (
    <>
      <PageShell
        title={wo.number}
        description={`${vehicle?.year} ${vehicle?.make} ${vehicle?.model} · ${customer?.name}`}
        actions={
          <>
            <Badge variant={wo.urgency === "high" ? "destructive" : "outline"} className="capitalize">AI urgency: {wo.aiUrgency}</Badge>
            <Badge variant="secondary" className="capitalize">{wo.status.replace("_", " ")}</Badge>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Quote" value={`$${wo.quoteAmount.toFixed(2)}`} sub={`${wo.laborHours} hr labor · $${wo.partsCost.toFixed(2)} parts`} />
          <Stat label="Quote score" value={`${wo.quoteScore}/100`} sub="reasonableness" />
          <Stat label="ETA" value={(() => { const d = new Date(wo.etaIso); return isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); })()} />
          <Stat label="Affected systems" value={String(affected.length)} sub={`of ${wo.subsystems.length}`} />
        </div>
        <div className="mt-6 overflow-hidden rounded-md border bg-card h-[480px] max-sm:h-[300px]">
          <VehicleViewer
            subsystems={wo.subsystems}
            mode="full"
            onSubsystemClick={handleSubsystemClick}
            className="h-full w-full"
          />
        </div>
        <div className="mt-6 rounded-md border bg-card p-5">
          <h2 className="text-sm font-semibold tracking-tight">Complaint</h2>
          <p className="mt-1 text-sm text-muted-foreground">{wo.complaint}</p>
        </div>
        {affected.length > 0 && (
          <div className="mt-6 space-y-3">
            {affected.map((s) => (
              <div key={s.key} className="rounded-md border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{s.label}</div>
                  <Badge variant={s.status === "fix" ? "destructive" : "outline"} className="uppercase">{s.status}</Badge>
                </div>
                {s.procedure && <p className="mt-2 text-sm text-muted-foreground">{s.procedure}</p>}
                {s.tools.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.tools.map((t) => (
                      <span key={t} className="rounded-sm border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
                {s.timeEstimateMin > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">Est. {s.timeEstimateMin} min</div>
                )}
              </div>
            ))}
          </div>
        )}

        {role === "technician" && (
          <div className="mt-6 space-y-6">
            {/* Subsystem + Ticket Status Controls (TECH-04) */}
            <div className="rounded-md border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Status Controls</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ticket</span>
                  <Select value={effTicketStatus} onValueChange={(v) => setTicketStatus(v as WorkOrderStatus)}>
                    <SelectTrigger className="w-44" aria-label="Ticket status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_STATUSES.map((st) => (
                        <SelectItem key={st} value={st}>{st.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {affected.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-3 min-h-[44px]">
                    <span className="text-sm">{s.key.replace("_", " ")}</span>
                    <Select value={subStatus(s)} onValueChange={(v) => setSubsystemStatus((prev) => ({ ...prev, [s.key]: v as SubsystemStatus }))}>
                      <SelectTrigger className="w-28" aria-label={`${s.key} status`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBSYSTEM_STATUSES.map((st) => (
                          <SelectItem key={st} value={st}>{st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Overview Note (TECH-07) */}
            <div className="rounded-md border bg-card p-5">
              <h2 className="text-lg font-semibold">Overview Note</h2>
              <Textarea
                rows={3}
                className="mt-2"
                placeholder="Add a quick note for the service advisor and customer..."
                value={notes[id] ?? ""}
                onChange={(e) => setNote(id, e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">Visible to service advisor and customer.</p>
            </div>

            {/* Tool Checkout (TECH-05) */}
            <div className="rounded-md border bg-card p-5">
              <h2 className="text-lg font-semibold">Tool Checkout</h2>
              <div className="mt-3 space-y-3">
                {tools.map((t) => {
                  const checked = checkedTools[t.id] ?? checkedOutToolIds.has(t.id);
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 min-h-[44px]">
                      <div>
                        <div className="text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.category}</div>
                      </div>
                      <Switch
                        checked={checked}
                        onCheckedChange={(v) => setCheckedTools((prev) => ({ ...prev, [t.id]: v }))}
                        aria-label={`${checked ? "Check in" : "Check out"} ${t.name}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timekeeping (TECH-06) */}
            <div className="rounded-md border bg-card p-5">
              <h2 className="text-lg font-semibold">Timekeeping</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat label="Today" value={`${fmtHours(todayMinutes)} hr`} />
                <Stat label="This week" value={`${fmtHours(weekMinutes)} hr`} />
              </div>
              <button
                type="button"
                onClick={() => setClockedIn((v) => !v)}
                className={clockedIn
                  ? "mt-3 inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                  : "mt-3 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"}
              >
                {clockedIn ? "Clock Out" : "Clock In"}
              </button>
            </div>
          </div>
        )}
      </PageShell>
      <SubsystemDetailPanel
        open={selectedSubsystem !== null}
        onClose={() => setSelectedSubsystem(null)}
        subsystem={selectedSubsystem}
      />
    </>
  );
}
