import { Wrench } from "lucide-react";

export function PlaceholderSubpage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Wrench className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden />
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This section is available in the full product. During the demo, use
        Overview, Work Orders, Finance, and Inventory.
      </p>
    </div>
  );
}
