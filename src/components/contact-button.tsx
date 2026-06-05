import { MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * ContactButton routes users to the Messages surface.
 * The `threadId` and `customerId` are passed as search params so the messages
 * page can pre-select or pre-filter the relevant thread.
 *
 * Per locked decision: ALL roles can message customers directly.
 */
export interface ContactButtonProps {
  /** Pre-select a specific thread by ID */
  threadId?: string;
  /** Filter threads for a specific customer */
  customerId?: string;
  /** Filter threads for a specific work order */
  workOrderId?: string;
  /** Button label override */
  label?: string;
  /** Visual variant */
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function ContactButton({
  threadId,
  customerId,
  workOrderId,
  label = "Message",
  variant = "outline",
  size = "sm",
  className,
}: ContactButtonProps) {
  // Build search params for the messages route
  const searchParams = new URLSearchParams();
  if (threadId) searchParams.set("thread", threadId);
  if (customerId) searchParams.set("customer", customerId);
  if (workOrderId) searchParams.set("workOrder", workOrderId);
  const queryString = searchParams.toString();
  const href = queryString ? `/messages?${queryString}` : "/messages";

  return (
    <Link
      to={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
        variant === "outline" &&
          "border bg-background/80 text-foreground shadow-sm hover:bg-accent",
        variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-foreground",
        variant === "default" &&
          "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
        className,
      )}
    >
      <MessageSquare className={cn("shrink-0", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      {label}
    </Link>
  );
}
