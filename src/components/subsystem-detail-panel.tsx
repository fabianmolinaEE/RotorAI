import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerPortal, DrawerOverlay } from "@/components/ui/drawer";
import { Drawer as DrawerPrimitive } from "vaul";
import type { Subsystem } from "@/data/types";

interface SubsystemDetailPanelProps {
  open: boolean;
  onClose: () => void;
  subsystem: Subsystem | null;
}

export function SubsystemDetailPanel({ open, onClose, subsystem }: SubsystemDetailPanelProps) {
  if (!subsystem) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      direction="right"
      shouldScaleBackground={false}
    >
      <DrawerPortal>
        <DrawerOverlay className="bg-black/60" onClick={onClose} />
        <DrawerPrimitive.Content
          className={cn(
            // Mobile: full-width bottom sheet
            "fixed inset-x-0 bottom-0 z-50 flex h-[80vh] max-h-[80vh] flex-col rounded-t-[10px] border bg-card",
            // sm+: right-side 40vw sheet
            "sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-full sm:w-[40vw] sm:min-w-[320px] sm:max-w-[480px] sm:rounded-none",
          )}
        >
          {/* Header: title + status badge + time estimate */}
          <div className="flex items-start justify-between gap-3 border-b p-5">
            <div>
              <DrawerPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                {subsystem.label}
              </DrawerPrimitive.Title>
              <DrawerPrimitive.Description className="mt-2 text-sm text-muted-foreground">
                {subsystem.timeEstimateMin > 0
                  ? `Estimated: ${subsystem.timeEstimateMin} min`
                  : "No time estimate"}
              </DrawerPrimitive.Description>
            </div>
            <Badge
              variant={
                subsystem.status === "fix"
                  ? "destructive"
                  : subsystem.status === "check"
                    ? "outline"
                    : "secondary"
              }
              className={cn("uppercase", subsystem.status === "check" && "text-amber-500")}
            >
              {subsystem.status.toUpperCase()}
            </Badge>
          </div>

          {/* Scrollable content sections */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Procedure section */}
            <section className="mt-6 first:mt-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                PROCEDURE
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {subsystem.procedure || "No procedure recorded."}
              </p>
            </section>

            {/* Tools Required section */}
            <section className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                TOOLS REQUIRED
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {subsystem.tools.map((t) => (
                  <span
                    key={t}
                    className="rounded-sm border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>

            {/* References section — conditional */}
            {subsystem.resources.length > 0 && (
              <section className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  REFERENCES
                </div>
                <ul className="mt-2 space-y-1">
                  {subsystem.resources.map((r) => (
                    <li key={r.label}>
                      <a
                        href={r.url}
                        className="text-sm text-primary underline-offset-4 hover:underline"
                      >
                        {r.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Footer with Close button */}
          <div className="mt-auto flex justify-end border-t p-4">
            <DrawerClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
}
