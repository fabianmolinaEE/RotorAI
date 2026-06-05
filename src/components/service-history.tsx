import { ReceiptText, Wrench } from "lucide-react";
import type { ServiceHistoryRecord } from "@/data/types";

const money = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

export function ServiceHistory({ records }: { records: ServiceHistoryRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/25 p-4 text-sm text-muted-foreground">
        No service history recorded for this vehicle yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const date = new Date(record.servicedAtIso);
        const dateLabel = isNaN(date.getTime())
          ? "Service date pending"
          : date.toLocaleDateString(undefined, { dateStyle: "medium" });

        return (
          <article key={record.id} className="rounded-xl glass-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-500/20 bg-sky-500/12 text-sky-600 dark:text-sky-300">
                  <Wrench className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{record.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {dateLabel} · {record.mileage.toLocaleString()} mi · {record.shopName}
                  </div>
                </div>
              </div>
              {record.invoiceTotal !== undefined && (
                <div className="rounded-lg border bg-background/60 px-3 py-2 text-right">
                  <div className="text-xs text-muted-foreground">Invoice</div>
                  <div className="text-sm font-semibold">{money(record.invoiceTotal)}</div>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{record.summary}</p>
            {record.customerNotes && (
              <div className="mt-3 rounded-lg bg-muted/35 p-3 text-sm">
                {record.customerNotes}
              </div>
            )}
            {record.invoiceId && (
              <button className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <ReceiptText className="h-4 w-4" />
                View invoice
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
