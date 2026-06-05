import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PhoneCall, Globe, UserCheck, Wrench, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { getDataService } from "@/data/dataService";
import type { AiDiagnosticSuggestion, NewConcern } from "@/data/types";
import { UrgencyBadge } from "@/components/urgency-badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Source label helpers ─────────────────────────────────────────────────────

const SOURCE_META: Record<
  NewConcern["source"],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  portal_form: { label: "Portal form", icon: Globe },
  phone_intake: { label: "Phone intake", icon: PhoneCall },
  walk_in: { label: "Walk-in", icon: UserCheck },
  tech_flagged: { label: "Tech-flagged", icon: Wrench },
};

function SourceBadge({ source }: { source: NewConcern["source"] }) {
  const { label, icon: Icon } = SOURCE_META[source];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ─── AI Diagnostic Suggestion selector ───────────────────────────────────────

function DiagnosticSuggestionItem({
  suggestion,
  selected,
  onToggle,
}: {
  suggestion: AiDiagnosticSuggestion;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(suggestion.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors",
        selected
          ? "border-primary/60 bg-primary/5"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <span className="mt-0.5 shrink-0 text-primary">
        {selected ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{suggestion.label}</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-medium",
              suggestion.confidenceLabel.startsWith("High")
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : suggestion.confidenceLabel.startsWith("Moderate")
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {suggestion.confidenceLabel}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{suggestion.description}</p>
      </div>
    </button>
  );
}

// ─── Draft Work Order form ────────────────────────────────────────────────────

interface DraftFormState {
  title: string;
  requestedDate: string;
  foremanNote: string;
}

function DraftWorkOrderForm({
  concern,
  selectedIds,
  diagnosticNotes,
  onCreated,
  onCancel,
}: {
  concern: NewConcern;
  selectedIds: string[];
  diagnosticNotes: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const svc = getDataService();
  const queryClient = useQueryClient();

  const defaultTitle = (): string => {
    // Build a default title from vehicle + concern complaint
    return concern.complaint.length > 60
      ? concern.complaint.slice(0, 57) + "..."
      : concern.complaint;
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<DraftFormState>({
    title: defaultTitle(),
    requestedDate: todayIso,
    foremanNote: "",
  });
  const [error, setError] = useState<string | null>(null);

  const diagMutation = useMutation({
    mutationFn: () =>
      svc.updateConcernDiagnostics({
        concernId: concern.id,
        selectedDiagnosticIds: selectedIds,
        diagnosticNotes,
      }),
  });

  const draftMutation = useMutation({
    mutationFn: () =>
      svc.createDraftWorkOrder({
        concernId: concern.id,
        title: form.title.trim(),
        requestedDateIso: new Date(form.requestedDate).toISOString(),
        foremanNote: form.foremanNote.trim(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["new-concerns"] });
      void queryClient.invalidateQueries({ queryKey: ["draft-work-orders"] });
      onCreated();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to create draft");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    // First persist diagnostic selections, then create draft
    await diagMutation.mutateAsync();
    draftMutation.mutate();
  };

  const isPending = diagMutation.isPending || draftMutation.isPending;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Ticket title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
          placeholder="Brief description for the foreman"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Requested date
        </label>
        <input
          type="date"
          value={form.requestedDate}
          onChange={(e) => setForm((p) => ({ ...p, requestedDate: e.target.value }))}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Note for foreman
        </label>
        <Textarea
          rows={3}
          value={form.foremanNote}
          onChange={(e) => setForm((p) => ({ ...p, foremanNote: e.target.value }))}
          placeholder="Priority, special instructions, customer availability..."
          className="resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Send to foreman"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Customer will not be notified until the foreman confirms the work order.
      </p>
    </form>
  );
}

// ─── ConcernIntakePanel ───────────────────────────────────────────────────────

export interface ConcernIntakePanelProps {
  concern: NewConcern;
  customerName: string;
  vehicleLabel: string;
}

export function ConcernIntakePanel({
  concern,
  customerName,
  vehicleLabel,
}: ConcernIntakePanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    concern.selectedDiagnosticIds ?? [],
  );
  const [diagnosticNotes, setDiagnosticNotes] = useState(
    concern.diagnosticNotes ?? "",
  );
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [draftCreated, setDraftCreated] = useState(concern.status === "drafted");

  const toggleSuggestion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const isDrafted = draftCreated || concern.status === "drafted";

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SourceBadge source={concern.source} />
            <UrgencyBadge urgency={concern.urgency} />
            {isDrafted && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Sent to foreman
              </span>
            )}
          </div>
          <p className="text-sm font-semibold">{customerName}</p>
          <p className="text-xs text-muted-foreground">{vehicleLabel}</p>
        </div>
        <p className="text-xs text-muted-foreground shrink-0">
          {new Date(concern.createdAtIso).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Complaint */}
      <div className="rounded-md bg-muted/40 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
          Customer complaint
        </p>
        <p className="text-sm">{concern.complaint}</p>
      </div>

      {/* AI Diagnostic Suggestions */}
      {concern.aiDiagnosticSuggestions.length > 0 && !isDrafted && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              AI diagnostic suggestions
            </span>
          </div>
          <div className="space-y-2">
            {[...concern.aiDiagnosticSuggestions]
              .sort((a) => (a.confidenceLabel.startsWith("High") ? -1 : 0))
              .map((suggestion) => (
                <DiagnosticSuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  selected={selectedIds.includes(suggestion.id)}
                  onToggle={toggleSuggestion}
                />
              ))}
          </div>
        </div>
      )}

      {/* Selected diagnostics summary when drafted */}
      {isDrafted && concern.aiDiagnosticSuggestions.length > 0 && (
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Diagnostics included
          </p>
          {(concern.selectedDiagnosticIds ?? []).length > 0 ? (
            <ul className="space-y-0.5">
              {(concern.selectedDiagnosticIds ?? []).map((id) => {
                const s = concern.aiDiagnosticSuggestions.find((x) => x.id === id);
                return s ? (
                  <li key={id} className="text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                    {s.label}
                  </li>
                ) : null;
              })}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">None selected</p>
          )}
        </div>
      )}

      {/* Free-text diagnostic notes */}
      {!isDrafted && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Diagnostic notes (optional)
          </label>
          <Textarea
            rows={2}
            value={diagnosticNotes}
            onChange={(e) => setDiagnosticNotes(e.target.value)}
            placeholder="Add your own observations or context..."
            className="resize-none"
          />
        </div>
      )}

      {/* Saved notes when drafted */}
      {isDrafted && concern.diagnosticNotes && (
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Advisor notes
          </p>
          <p className="text-xs">{concern.diagnosticNotes}</p>
        </div>
      )}

      {/* Actions */}
      {!isDrafted && !showDraftForm && (
        <button
          type="button"
          onClick={() => setShowDraftForm(true)}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Schedule draft for foreman
        </button>
      )}

      {showDraftForm && !isDrafted && (
        <DraftWorkOrderForm
          concern={concern}
          selectedIds={selectedIds}
          diagnosticNotes={diagnosticNotes}
          onCreated={() => {
            setDraftCreated(true);
            setShowDraftForm(false);
          }}
          onCancel={() => setShowDraftForm(false)}
        />
      )}

    </div>
  );
}
