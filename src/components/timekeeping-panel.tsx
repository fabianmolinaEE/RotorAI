import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, LogIn, LogOut } from "lucide-react";
import { getDataService } from "@/data/dataService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimekeepingPanelProps {
  technicianId: string;
  bayId?: string | null;
  className?: string;
}

/**
 * Shift-level timekeeping widget for the technician landing.
 *
 * - Clock in / clock out actions persist to mock data (session-persistent per locked decision).
 * - Break/lunch button is shown but disabled — labeled "Coming soon" per locked decision.
 * - Elapsed time ticks from the shift clock-in timestamp.
 */
export function TimekeepingPanel({ technicianId, bayId = null, className }: TimekeepingPanelProps) {
  const svc = getDataService();
  const qc = useQueryClient();

  const { data: activeShift, isLoading } = useQuery({
    queryKey: ["activeShift", technicianId],
    queryFn: () => svc.getActiveShift(technicianId),
    // Re-fetch every 30 s so elapsed-time stays fresh if another tab changes state
    refetchInterval: 30_000,
  });

  const { data: tech } = useQuery({
    queryKey: ["tech", technicianId],
    queryFn: () => svc.getTechnicianById(technicianId),
  });

  const [now, setNow] = useState(() => Date.now());
  // Tick every minute to update elapsed time display
  useState(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  });

  const clockInMutation = useMutation({
    mutationFn: () => svc.clockIn({ technicianId, bayId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["activeShift", technicianId] });
      void qc.invalidateQueries({ queryKey: ["tech", technicianId] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => svc.clockOut(technicianId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["activeShift", technicianId] });
      void qc.invalidateQueries({ queryKey: ["tech", technicianId] });
    },
  });

  const isClockedIn = !!activeShift;

  function elapsedLabel(): string {
    if (!activeShift) return "—";
    const diffMs = now - new Date(activeShift.clockedInIso).getTime();
    const totalMin = Math.max(0, Math.floor(diffMs / 60_000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }

  function clockInTimeLabel(): string {
    if (!activeShift) return "—";
    return new Date(activeShift.clockedInIso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const isBusy = clockInMutation.isPending || clockOutMutation.isPending;

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock className="size-4 text-muted-foreground" />
          Shift
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status + elapsed */}
          <div className="flex items-center gap-3">
            <Badge
              variant={isClockedIn ? "default" : "secondary"}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                isClockedIn && "bg-green-600 text-white dark:bg-green-500",
              )}
            >
              {isLoading ? "…" : isClockedIn ? "Clocked in" : "Clocked out"}
            </Badge>
            {isClockedIn && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{elapsedLabel()}</span>
                {" "}elapsed · in at {clockInTimeLabel()}
                {activeShift?.bayId && (
                  <span className="ml-2">· Bay {activeShift.bayId.replace("bay_", "")}</span>
                )}
              </div>
            )}
            {!isClockedIn && !isLoading && (
              <span className="text-sm text-muted-foreground">Not on shift</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Break — Coming soon placeholder per locked decision */}
            <Button
              variant="outline"
              size="sm"
              disabled
              className="cursor-not-allowed opacity-60"
              title="Break tracking coming soon"
            >
              Break
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                Coming soon
              </Badge>
            </Button>

            {isClockedIn ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => clockOutMutation.mutate()}
                disabled={isBusy}
                className="gap-1.5"
              >
                <LogOut className="size-3.5" />
                Clock out
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => clockInMutation.mutate()}
                disabled={isBusy || isLoading}
                className="gap-1.5"
              >
                <LogIn className="size-3.5" />
                Clock in
              </Button>
            )}
          </div>
        </div>

        {/* Scheduled hours footnote */}
        {isClockedIn && activeShift && (
          <p className="mt-3 text-xs text-muted-foreground">
            Scheduled: {activeShift.scheduledHours}h shift
            {activeShift.breakMinutes > 0 && ` · ${activeShift.breakMinutes}m break recorded`}
          </p>
        )}

        {/* Technician weekly context */}
        {tech && (
          <p className="mt-2 text-xs text-muted-foreground">
            {tech.weeklyCompleted} ticket{tech.weeklyCompleted !== 1 ? "s" : ""} completed this week
          </p>
        )}
      </CardContent>
    </Card>
  );
}
