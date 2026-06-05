import { CircleDollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuoteBreakdown } from "@/data/types";

const money = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const categoryLabels: Record<QuoteBreakdown["lines"][number]["category"], string> = {
  labor: "Labor",
  parts: "Parts",
  equipment: "Equipment",
  shop_supplies: "Shop supplies",
  fees: "Fees",
  tax: "Tax",
};

export function QuoteBreakdownCard({
  quote,
  variant = "internal",
  className,
}: {
  quote: QuoteBreakdown;
  variant?: "internal" | "customer";
  className?: string;
}) {
  const lines =
    variant === "customer" ? quote.lines.filter((line) => line.customerVisible) : quote.lines;
  const visibleSubtotal = lines.reduce((sum, line) => sum + line.total, 0);

  return (
    <section className={cn("rounded-2xl glass-card p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
              <CircleDollarSign className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                {variant === "customer" ? "Quote summary" : "Quote breakdown"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {quote.status === "draft" ? "Pending shop review" : "Prepared for review"}
              </p>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {quote.customerSummary}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
          <div className="text-2xl font-semibold tracking-tight">{money(quote.total)}</div>
        </div>
      </div>

      {lines.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-xl border bg-background/45">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{categoryLabels[line.category]}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <div>{line.label}</div>
                    {line.description && <div className="text-xs">{line.description}</div>}
                    {variant === "internal" && line.internalNote && (
                      <div className="mt-1 text-xs text-sky-600 dark:text-sky-300">
                        {line.internalNote}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {line.unit === "flat" ? "1" : `${line.quantity} ${line.unit}`}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {money(line.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          The shop will prepare a quote after diagnosis.
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {variant === "customer"
            ? `Visible summary: ${money(visibleSubtotal)} before tax and hidden internal notes.`
            : `Subtotal ${money(quote.subtotal)} · Tax ${money(quote.tax)}`}
        </div>
        {variant === "customer" && quote.customerDetailAvailable && (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Request detailed quote
          </Button>
        )}
      </div>
    </section>
  );
}
