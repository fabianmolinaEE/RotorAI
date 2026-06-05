import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UrgencyBadge } from "@/components/urgency-badge";
import { cn } from "@/lib/utils";
import type { Bay, Technician, Vehicle, WorkOrder } from "@/data/types";

interface TicketDelegationPanelProps {
  /** Pending / new work orders available for delegation */
  pendingWOs: WorkOrder[];
  bays: Bay[];
  technicians: Technician[];
  vehicleById: Map<string, Vehicle>;
  onDelegate: (params: {
    workOrderId: string;
    bayId: string;
    technicianId: string;
  }) => Promise<void>;
}

export function TicketDelegationPanel({
  pendingWOs,
  bays,
  technicians,
  vehicleById,
  onDelegate,
}: TicketDelegationPanelProps) {
  const [selectedWO, setSelectedWO] = useState<string>("");
  const [selectedBay, setSelectedBay] = useState<string>("");
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [lastDelegated, setLastDelegated] = useState<string | null>(null);

  // Only offer empty bays for new assignments
  const availableBays = bays.filter((b) => b.status === "empty");
  const clockedInTechs = technicians.filter((t) => t.clockedIn);

  const canSubmit = !!selectedWO && !!selectedBay && !!selectedTech && !busy;

  async function handleDelegate() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onDelegate({
        workOrderId: selectedWO,
        bayId: selectedBay,
        technicianId: selectedTech,
      });
      const woNum = pendingWOs.find((w) => w.id === selectedWO)?.number ?? selectedWO;
      setLastDelegated(woNum);
      setSelectedWO("");
      setSelectedBay("");
      setSelectedTech("");
    } finally {
      setBusy(false);
    }
  }

  if (pendingWOs.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No pending tickets waiting for assignment.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {lastDelegated && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          {lastDelegated} assigned successfully.
        </div>
      )}

      {/* Pending ticket list */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Pending tickets
        </p>
        <div className="space-y-2">
          {pendingWOs.map((wo) => {
            const v = vehicleById.get(wo.vehicleId);
            const isSelected = wo.id === selectedWO;
            return (
              <button
                key={wo.id}
                type="button"
                onClick={() => setSelectedWO(isSelected ? "" : wo.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-border hover:bg-muted/30",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{wo.number}</span>
                  <UrgencyBadge urgency={wo.urgency} />
                </div>
                <div className="mt-1 text-sm text-foreground line-clamp-1">{wo.title}</div>
                {v && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {v.year} {v.make} {v.model}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignment selectors */}
      <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Assign to
        </p>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Bay</label>
          {availableBays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No empty bays available.</p>
          ) : (
            <Select value={selectedBay} onValueChange={setSelectedBay}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select bay…" />
              </SelectTrigger>
              <SelectContent>
                {availableBays.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Technician (clocked in)</label>
          {clockedInTechs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No technicians clocked in.</p>
          ) : (
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select technician…" />
              </SelectTrigger>
              <SelectContent>
                {clockedInTechs.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {t.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          className="w-full"
          disabled={!canSubmit}
          onClick={handleDelegate}
        >
          {busy ? "Assigning…" : "Assign ticket"}
        </Button>

        {!selectedWO && (
          <p className="text-center text-xs text-muted-foreground">
            Select a pending ticket above first.
          </p>
        )}
      </div>
    </div>
  );
}
