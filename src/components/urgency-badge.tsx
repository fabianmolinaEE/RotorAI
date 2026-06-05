import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const urgencyClasses: Record<string, string> = {
  high: "border-red-200 bg-red-100 text-red-700 shadow-sm shadow-red-500/10 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300",
  normal:
    "border-amber-200 bg-amber-100 text-amber-700 shadow-sm shadow-amber-500/10 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  low: "border-slate-200 bg-slate-100 text-slate-500 shadow-sm shadow-slate-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

const urgencyLabels: Record<string, string> = {
  high: "HIGH",
  normal: "NORMAL",
  low: "LOW",
};

const urgencyAriaLabels: Record<string, string> = {
  high: "High urgency",
  normal: "Normal priority",
  low: "Low priority",
};

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const classes = urgencyClasses[urgency] ?? urgencyClasses.low;
  const label = urgencyLabels[urgency] ?? urgency.toUpperCase();
  const ariaLabel = urgencyAriaLabels[urgency] ?? urgency;

  return (
    <Badge className={cn(classes)} aria-label={ariaLabel}>
      {label}
    </Badge>
  );
}
