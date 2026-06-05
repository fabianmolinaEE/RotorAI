import { useState } from "react";
import { CalendarClock, Check, MessageCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomerRecommendation, RecommendationStatus } from "@/data/types";

const severityClasses: Record<CustomerRecommendation["severity"], string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
};

const statusLabels: Record<RecommendationStatus, string> = {
  new: "New",
  accepted: "Accepted",
  declined: "Declined",
  snoozed: "Snoozed",
};

export function CustomerRecommendations({
  recommendations,
}: {
  recommendations: CustomerRecommendation[];
}) {
  const [statuses, setStatuses] = useState<Record<string, RecommendationStatus>>({});

  if (recommendations.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/25 p-4 text-sm text-muted-foreground">
        No recommendations right now.
      </div>
    );
  }

  const update = (id: string, status: RecommendationStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: status }));

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {recommendations.map((rec) => {
        const status = statuses[rec.id] ?? rec.status;
        return (
          <article key={rec.id} className="rounded-xl glass-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{rec.title}</h3>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", severityClasses[rec.severity])}>
                      {rec.severity}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {rec.generatedBy === "ai" ? "AI maintenance recommendation" : "Advisor recommendation"}
                  </div>
                </div>
              </div>
              <span className="rounded-full border bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
                {statusLabels[status]}
              </span>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">{rec.reason}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {rec.dueWindow}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => update(rec.id, "accepted")}>
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => update(rec.id, "snoozed")}>
                <CalendarClock className="h-4 w-4" />
                Snooze
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => update(rec.id, "declined")}>
                <X className="h-4 w-4" />
                Decline
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5">
                <MessageCircle className="h-4 w-4" />
                Ask
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
