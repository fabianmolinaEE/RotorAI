import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClasses: Record<string, string> = {
  new: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  scheduled: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  awaiting_parts:
    "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  completed:
    "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  invoiced:
    "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const statusLabels: Record<string, string> = {
  new: "New",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  awaiting_parts: "Waiting on Parts",
  completed: "Completed",
  invoiced: "Invoiced",
};

export function StatusChip({ status }: { status: string }) {
  const classes = statusClasses[status] ?? statusClasses.new;
  const label = statusLabels[status] ?? status;

  return (
    <Badge className={cn(classes)} aria-label={label}>
      {label}
    </Badge>
  );
}
